package com.idve.backend.repository;

import com.idve.backend.entity.UserDocument;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDocumentRepository extends JpaRepository<UserDocument, Long> {
    Optional<UserDocument> findByUserId(Long userId);
    List<UserDocument> findAllByUserIdIn(List<Long> userIds);
}
