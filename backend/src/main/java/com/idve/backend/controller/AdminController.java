package com.idve.backend.controller;

import com.idve.backend.dto.UserResponse;
import com.idve.backend.dto.AuditLogResponse;
import com.idve.backend.entity.User;
import com.idve.backend.entity.AuditLog;
import com.idve.backend.entity.UserDocument;
import com.idve.backend.exception.BadRequestException;
import com.idve.backend.service.AuditLogService;
import com.idve.backend.service.DemoResetService;
import com.idve.backend.repository.UserDocumentRepository;
import com.idve.backend.repository.UserRepository;
import java.util.List;
import java.security.Principal;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final UserDocumentRepository userDocumentRepository;
    private final DemoResetService demoResetService;

    public AdminController(UserRepository userRepository,
                           AuditLogService auditLogService,
                           UserDocumentRepository userDocumentRepository,
                           DemoResetService demoResetService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.userDocumentRepository = userDocumentRepository;
        this.demoResetService = demoResetService;
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return userRepository.findAll().stream()
            .map(this::toUserResponse)
            .toList();
    }

    @PatchMapping("/users/{id}/approve")
    public UserResponse approve(@PathVariable Long id, Principal principal) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BadRequestException("User not found"));

        user.setVerificationStatus("VERIFIED");
        User saved = userRepository.save(user);
        auditLogService.record("APPROVED", principal == null ? null : principal.getName(), saved.getEmail());
        return toUserResponse(saved);
    }

    @PatchMapping("/users/{id}/reject")
    public UserResponse reject(@PathVariable Long id, Principal principal) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BadRequestException("User not found"));

        user.setVerificationStatus("REJECTED");
        User saved = userRepository.save(user);
        auditLogService.record("REJECTED", principal == null ? null : principal.getName(), saved.getEmail());
        return toUserResponse(saved);
    }

    @GetMapping("/audit-logs")
    public List<AuditLogResponse> auditLogs() {
        return auditLogService.latest().stream()
            .map(this::toAuditLogResponse)
            .toList();
    }

    @DeleteMapping("/demo-data")
    public java.util.Map<String, Object> resetDemoData() {
        int removedAccounts = demoResetService.reset();
        return java.util.Map.of(
            "message", "Demo data has been cleared.",
            "removedAccounts", removedAccounts
        );
    }

    private AuditLogResponse toAuditLogResponse(AuditLog log) {
        return new AuditLogResponse(
            log.getId(),
            log.getAction(),
            log.getSubjectEmail(),
            log.getActorEmail(),
            log.getCreatedAt()
        );
    }

    @GetMapping(value = "/users/{id}/document")
    public ResponseEntity<byte[]> document(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BadRequestException("User not found"));
        UserDocument document = userDocumentRepository.findByUserId(user.getId())
            .orElseThrow(() -> new BadRequestException("No document is attached to this account."));
        byte[] content = document.getContent();
        if (content == null || content.length == 0) {
            throw new BadRequestException("No document is attached to this account.");
        }

        String contentType = document.getContentType();
        MediaType mediaType = MediaType.APPLICATION_PDF_VALUE.equals(contentType)
            ? MediaType.APPLICATION_PDF
            : "image/png".equals(contentType) ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        String filename = document.getFileName();

        return ResponseEntity.ok()
            .contentType(mediaType)
            .cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options", "nosniff")
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(filename).build().toString())
            .body(content);
    }

    private UserResponse toUserResponse(User user) {
        String role = (user.getRole() == null || user.getRole().isBlank()) ? "USER" : user.getRole();
        String verificationStatus =
            (user.getVerificationStatus() == null || user.getVerificationStatus().isBlank())
                ? "PENDING"
                : user.getVerificationStatus();

        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            role,
            verificationStatus,
            user.getDocumentPath()
        );
    }
}
