package com.idve.backend.config;

import com.idve.backend.entity.User;
import com.idve.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoAdminBootstrapper implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo-admin.email:}")
    private String adminEmail;

    @Value("${app.demo-admin.password:}")
    private String adminPassword;

    public DemoAdminBootstrapper(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;
        }

        if (adminPassword.length() < 12) {
            throw new IllegalStateException("DEMO_ADMIN_PASSWORD must contain at least 12 characters.");
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        User admin = userRepository.findByEmail(normalizedEmail).orElseGet(User::new);
        admin.setName("IDVE Demo Administrator");
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole("ADMIN");
        userRepository.save(admin);
    }
}
