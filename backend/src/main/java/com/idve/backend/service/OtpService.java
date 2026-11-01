package com.idve.backend.service;

import com.idve.backend.exception.BadRequestException;
import com.idve.backend.entity.OtpVerification;
import com.idve.backend.repository.OtpVerificationRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final SecureRandom random = new SecureRandom();
    private final OtpVerificationRepository otpVerificationRepository;
    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.redis.enabled:false}")
    private boolean redisEnabled;

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from:}")
    private String configuredMailFrom;

    @Value("${app.otp.dev-fallback-enabled:false}")
    private boolean devFallbackEnabled;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Autowired
    public OtpService(ObjectProvider<JavaMailSender> mailSenderProvider,
                      ObjectProvider<StringRedisTemplate> redisTemplateProvider,
                      OtpVerificationRepository otpVerificationRepository) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.otpVerificationRepository = otpVerificationRepository;
    }

    public OtpService(ObjectProvider<JavaMailSender> mailSenderProvider,
                      OtpVerificationRepository otpVerificationRepository) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.redisTemplate = null;
        this.otpVerificationRepository = otpVerificationRepository;
    }

    public static final String REGISTRATION_PURPOSE = "REGISTRATION";
    public static final String PASSWORD_RESET_PURPOSE = "PASSWORD_RESET";

    @Transactional
    public String sendOtp(String email) {
        return sendOtp(email, REGISTRATION_PURPOSE);
    }

    @Transactional
    public String sendPasswordResetOtp(String email) {
        return sendOtp(email, PASSWORD_RESET_PURPOSE);
    }

    @Transactional
    public String sendOtp(String email, String purpose) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        String normalizedEmail = normalizeEmail(email);
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_SECONDS);
        boolean sent = false;

        try {
            sendEmail(email, otp);
            sent = true;
        } catch (BadRequestException ex) {
            if (!devFallbackEnabled) {
                throw ex;
            }
            log.warn("OTP email failed, using dev fallback for {}", normalizedEmail);
        }

        if (redisEnabled && redisTemplate != null) {
            redisTemplate.opsForValue().set(redisKey(normalizedEmail, purpose), otp, Duration.ofSeconds(OTP_EXPIRY_SECONDS));
            return sent ? null : otp;
        }

        Instant now = Instant.now();
        OtpVerification record = otpVerificationRepository.findByEmailAndPurpose(normalizedEmail, purpose)
            .orElseGet(() -> otpVerificationRepository.findByEmail(normalizedEmail).orElseGet(OtpVerification::new));

        record.setEmail(normalizedEmail);
        record.setOtp(otp);
        record.setPurpose(purpose);
        record.setExpiresAt(expiresAt);
        record.setCreatedAt(now);

        try {
            otpVerificationRepository.save(record);
        } catch (DataIntegrityViolationException ex) {
            OtpVerification existing = otpVerificationRepository.findByEmailAndPurpose(normalizedEmail, purpose)
                .orElseThrow(() -> ex);
            existing.setOtp(otp);
            existing.setPurpose(purpose);
            existing.setExpiresAt(expiresAt);
            existing.setCreatedAt(now);
            otpVerificationRepository.save(existing);
        }

        return sent ? null : otp;
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        verifyOtp(email, otp, REGISTRATION_PURPOSE);
    }

    @Transactional
    public void verifyPasswordResetOtp(String email, String otp) {
        try {
            verifyOtp(email, otp, PASSWORD_RESET_PURPOSE);
        } catch (BadRequestException ex) {
            throw new BadRequestException("Invalid or expired password reset code.");
        }
    }

    @Transactional
    public void verifyOtp(String email, String otp, String purpose) {
        String normalizedEmail = normalizeEmail(email);
        if (redisEnabled && redisTemplate != null) {
            String key = redisKey(normalizedEmail, purpose);
            String storedOtp = redisTemplate.opsForValue().get(key);
            if (storedOtp == null) {
                throw new BadRequestException("OTP not found. Please request a new OTP.");
            }
            if (!storedOtp.equals(otp)) {
                throw new BadRequestException("OTP is incorrect.");
            }
            redisTemplate.delete(key);
            return;
        }

        OtpVerification entry = otpVerificationRepository.findByEmailAndPurpose(normalizedEmail, purpose)
            .orElseGet(() -> purpose.equals(REGISTRATION_PURPOSE)
                ? otpVerificationRepository.findByEmail(normalizedEmail).orElse(null)
                : null);

        if (entry == null) {
            throw new BadRequestException("OTP not found. Please request a new OTP.");
        }

        if (Instant.now().isAfter(entry.getExpiresAt())) {
            deleteOtp(normalizedEmail, purpose);
            throw new BadRequestException("OTP expired. Please request a new OTP.");
        }

        if (!entry.getOtp().equals(otp)) {
            throw new BadRequestException("OTP is incorrect.");
        }

        deleteOtp(normalizedEmail, purpose);
    }

    private void deleteOtp(String email, String purpose) {
        if (purpose.equals(REGISTRATION_PURPOSE)) {
            otpVerificationRepository.deleteByEmail(email);
            return;
        }

        otpVerificationRepository.deleteByEmailAndPurpose(email, purpose);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String redisKey(String email, String purpose) {
        return "idve:otp:" + purpose + ":" + email;
    }

    private void sendEmail(String email, String otp) {
        if (!resendApiKey.isBlank()) {
            sendWithResend(email, otp);
            return;
        }
        if (mailSender == null) {
            throw new BadRequestException("Email service is not configured. OTP cannot be sent.");
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            String from = !configuredMailFrom.isBlank() ? configuredMailFrom : mailFrom;
            if (from != null && !from.isBlank()) {
                msg.setFrom(from);
            }
            msg.setTo(email);
            msg.setSubject("Your IDVE verification code");
            msg.setText("Your verification code is: " + otp + "\nThis code expires in 5 minutes.");
            mailSender.send(msg);
        } catch (Exception ex) {
            log.error("Unable to send OTP email to {}", email, ex);
            throw new BadRequestException("Unable to send OTP email. Please verify SMTP settings.");
        }
    }

    private void sendWithResend(String email, String otp) {
        if (configuredMailFrom.isBlank()) {
            throw new BadRequestException("Email sender is not configured. Set MAIL_FROM.");
        }
        try {
            org.springframework.web.client.RestClient.create("https://api.resend.com")
                .post()
                .uri("/emails")
                .header("Authorization", "Bearer " + resendApiKey)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(java.util.Map.of(
                    "from", configuredMailFrom,
                    "to", java.util.List.of(email),
                    "subject", "Your IDVE verification code",
                    "text", "Your verification code is: " + otp + "\nThis code expires in 5 minutes."
                ))
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ex) {
            log.error("Unable to send OTP email to {}", email, ex);
            throw new BadRequestException("Unable to send OTP email. Please verify Resend settings.");
        }
    }
}
