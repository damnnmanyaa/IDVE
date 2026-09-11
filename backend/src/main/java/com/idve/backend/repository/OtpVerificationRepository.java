package com.idve.backend.repository;

import com.idve.backend.entity.OtpVerification;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findByEmail(String email);
    Optional<OtpVerification> findByEmailAndPurpose(String email, String purpose);
    void deleteByEmail(String email);
    void deleteByEmailAndPurpose(String email, String purpose);
}
