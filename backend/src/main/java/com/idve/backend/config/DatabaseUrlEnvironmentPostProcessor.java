package com.idve.backend.config;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Normalizes provider-injected DATABASE_URL values so managed databases that export
 * DATABASE_URL (Render, Railway, Heroku) work without manual URL rewriting:
 *
 * <ul>
 *   <li>{@code postgres://} / {@code postgresql://} schemes are converted to {@code jdbc:postgresql://}</li>
 *   <li>{@code user:password@} userinfo is stripped from the URL and exposed as
 *       {@code spring.datasource.username} / {@code spring.datasource.password} (pgjdbc does
 *       not parse userinfo). Explicit DB_USER / DB_PASSWORD environment variables still win.</li>
 * </ul>
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final String PROPERTY_SOURCE_NAME = "normalizedDatabaseUrl";
    private static final String DATASOURCE_URL_PROPERTY = "spring.datasource.url";
    private static final String[] SOURCE_SCHEMES = { "postgres://", "postgresql://" };
    private static final String JDBC_SCHEME = "jdbc:postgresql://";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        NormalizedDataSource normalized = normalize(
                environment.getProperty(DATASOURCE_URL_PROPERTY),
                environment.getProperty("DB_USER"),
                environment.getProperty("DB_PASSWORD"));
        if (normalized == null) {
            return;
        }

        Map<String, Object> properties = new HashMap<>();
        properties.put(DATASOURCE_URL_PROPERTY, normalized.url());
        if (normalized.username() != null) {
            properties.put("spring.datasource.username", normalized.username());
        }
        if (normalized.password() != null) {
            properties.put("spring.datasource.password", normalized.password());
        }
        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
    }

    static NormalizedDataSource normalize(String rawUrl, String explicitUser, String explicitPassword) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }

        String url = rawUrl.trim();
        String scheme = null;
        for (String candidate : SOURCE_SCHEMES) {
            if (url.startsWith(candidate)) {
                scheme = candidate;
                break;
            }
        }
        if (scheme == null) {
            return null;
        }

        String rest = url.substring(scheme.length());
        String username = null;
        String password = null;

        int slash = rest.indexOf('/');
        String authority = slash >= 0 ? rest.substring(0, slash) : rest;

        int at = authority.lastIndexOf('@');
        if (at >= 0) {
            String userInfo = authority.substring(0, at);
            authority = authority.substring(at + 1);

            int colon = userInfo.indexOf(':');
            if (colon >= 0) {
                username = urlDecode(userInfo.substring(0, colon));
                password = urlDecode(userInfo.substring(colon + 1));
            } else if (!userInfo.isBlank()) {
                username = urlDecode(userInfo);
            }
        }

        String normalizedUrl = JDBC_SCHEME + authority + (slash >= 0 ? rest.substring(slash) : "");
        return new NormalizedDataSource(
                normalizedUrl,
                explicitUser == null ? username : null,
                explicitPassword == null ? password : null);
    }

    private static String urlDecode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    record NormalizedDataSource(String url, String username, String password) {
    }

    @Override
    public int getOrder() {
        // Must run after ConfigDataEnvironmentPostProcessor (HIGHEST_PRECEDENCE + 10)
        // so application.yml is loaded and the datasource URL placeholder is resolvable.
        return Ordered.HIGHEST_PRECEDENCE + 11;
    }
}
