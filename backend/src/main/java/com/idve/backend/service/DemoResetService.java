package com.idve.backend.service;

import com.idve.backend.entity.User;
import com.idve.backend.repository.OtpVerificationRepository;
import com.idve.backend.repository.UserDocumentRepository;
import com.idve.backend.repository.UserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoResetService {

    private final UserRepository userRepository;
    private final UserDocumentRepository userDocumentRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final AuditLogService auditLogService;

    @Value("${app.demo.reset-enabled:false}")
    private boolean resetEnabled;

    public DemoResetService(UserRepository userRepository,
                            UserDocumentRepository userDocumentRepository,
                            OtpVerificationRepository otpVerificationRepository,
                            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.userDocumentRepository = userDocumentRepository;
        this.otpVerificationRepository = otpVerificationRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public int reset() {
        if (!resetEnabled) {
            throw new IllegalStateException("Demo data reset is disabled.");
        }

        List<User> demoUsers = userRepository.findAllByRoleIgnoreCase("USER");
        if (!demoUsers.isEmpty()) {
            List<Long> userIds = demoUsers.stream().map(User::getId).toList();
            userDocumentRepository.deleteAll(userDocumentRepository.findAllByUserIdIn(userIds));
            userRepository.deleteAll(demoUsers);
        }
        otpVerificationRepository.deleteAllInBatch();
        auditLogService.clear();
        return demoUsers.size();
    }
}
