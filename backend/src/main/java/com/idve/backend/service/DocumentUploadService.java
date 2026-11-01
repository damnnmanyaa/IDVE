package com.idve.backend.service;

import com.idve.backend.entity.User;
import com.idve.backend.entity.UserDocument;
import com.idve.backend.exception.BadRequestException;
import com.idve.backend.repository.UserDocumentRepository;
import com.idve.backend.repository.UserRepository;
import java.io.IOException;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentUploadService {

    public static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private final UserRepository userRepository;
    private final UserDocumentRepository userDocumentRepository;

    public DocumentUploadService(UserRepository userRepository, UserDocumentRepository userDocumentRepository) {
        this.userRepository = userRepository;
        this.userDocumentRepository = userDocumentRepository;
    }

    @Transactional
    public User uploadForUser(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose a file to upload.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("The file must be 5 MB or smaller.");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));

        try {
            byte[] content = file.getBytes();
            String contentType = detectContentType(content);
            String originalName = Optional.ofNullable(file.getOriginalFilename()).orElse("document");
            String documentName = originalName.replace('\\', '/');
            documentName = documentName.substring(documentName.lastIndexOf('/') + 1)
                .replaceAll("[^A-Za-z0-9._-]", "_");
            if (documentName.isBlank() || documentName.length() > 120) {
                documentName = "identity-document";
            }

            user.setDocumentPath(documentName);
            user.setVerificationStatus("PENDING");
            User savedUser = userRepository.save(user);
            UserDocument document = userDocumentRepository.findByUserId(savedUser.getId()).orElseGet(UserDocument::new);
            document.setUserId(savedUser.getId());
            document.setFileName(documentName);
            document.setContentType(contentType);
            document.setContent(content);
            userDocumentRepository.save(document);
            return savedUser;
        } catch (IOException ex) {
            throw new BadRequestException("The uploaded file could not be read.");
        }
    }

    private String detectContentType(byte[] content) {
        if (content.length >= 5
            && content[0] == '%'
            && content[1] == 'P'
            && content[2] == 'D'
            && content[3] == 'F'
            && content[4] == '-') {
            return "application/pdf";
        }
        if (content.length >= 8
            && (content[0] & 0xff) == 0x89
            && content[1] == 'P'
            && content[2] == 'N'
            && content[3] == 'G'
            && content[4] == 0x0d
            && content[5] == 0x0a
            && content[6] == 0x1a
            && content[7] == 0x0a) {
            return "image/png";
        }
        if (content.length >= 3
            && (content[0] & 0xff) == 0xff
            && (content[1] & 0xff) == 0xd8
            && (content[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        throw new BadRequestException("Upload a PDF, PNG, or JPEG document.");
    }
}
