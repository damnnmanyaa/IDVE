package com.idve.backend.dto;

import java.time.Instant;

public record AuditLogResponse(Long id, String action, String userEmail, String actorEmail, Instant timestamp) {
}
