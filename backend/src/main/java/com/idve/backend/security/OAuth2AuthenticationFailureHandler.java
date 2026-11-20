package com.idve.backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationFailureHandler.class);
    private final String frontendRedirectUri;
    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    public OAuth2AuthenticationFailureHandler(
        @Value("${app.oauth2.redirect-uri}") String frontendRedirectUri
    ) {
        this.frontendRedirectUri = frontendRedirectUri;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String path = request.getRequestURI();
        String provider = path.substring(path.lastIndexOf('/') + 1);
        logger.warn("OAuth sign-in failed for provider {} ({})", provider, exception.getClass().getSimpleName());

        String targetUrl = UriComponentsBuilder
            .fromUriString(frontendRedirectUri)
            .queryParam("error", "oauth_login_failed")
            .build()
            .toUriString();

        redirectStrategy.sendRedirect(request, response, targetUrl);
    }
}
