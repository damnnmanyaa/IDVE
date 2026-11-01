package com.idve.backend.service;

import com.idve.backend.entity.AuditLog;
import com.idve.backend.repository.AuditLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String actorEmail, String subjectEmail) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setActorEmail(actorEmail == null ? "unknown" : actorEmail);
        log.setSubjectEmail(subjectEmail);
        auditLogRepository.save(log);
    }

    public List<AuditLog> latest() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    public void clear() {
        auditLogRepository.deleteAllInBatch();
    }
}
