package com.idve.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DatabaseUrlEnvironmentPostProcessorTest {

    @Test
    void rewritesRenderStylePostgresUrlWithCredentials() {
        DatabaseUrlEnvironmentPostProcessor.NormalizedDataSource result =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgres://myuser:mysecret@db.internal:5432/idve_db", null, null);

        assertThat(result.url()).isEqualTo("jdbc:postgresql://db.internal:5432/idve_db");
        assertThat(result.username()).isEqualTo("myuser");
        assertThat(result.password()).isEqualTo("mysecret");
    }

    @Test
    void rewritesPostgresqlSchemePreservingQueryParams() {
        DatabaseUrlEnvironmentPostProcessor.NormalizedDataSource result =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgresql://user:pass@host/db?sslmode=require", null, null);

        assertThat(result.url()).isEqualTo("jdbc:postgresql://host/db?sslmode=require");
        assertThat(result.username()).isEqualTo("user");
        assertThat(result.password()).isEqualTo("pass");
    }

    @Test
    void keepsUrlWithoutPath() {
        DatabaseUrlEnvironmentPostProcessor.NormalizedDataSource result =
                DatabaseUrlEnvironmentPostProcessor.normalize("postgres://user:pass@host:5432", null, null);

        assertThat(result.url()).isEqualTo("jdbc:postgresql://host:5432");
    }

    @Test
    void decodesUrlEncodedCredentials() {
        DatabaseUrlEnvironmentPostProcessor.NormalizedDataSource result =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgres://db_user:p%40ss%3Aword@host:5432/db", null, null);

        assertThat(result.username()).isEqualTo("db_user");
        assertThat(result.password()).isEqualTo("p@ss:word");
    }

    @Test
    void handlesUserOnlyUrl() {
        DatabaseUrlEnvironmentPostProcessor.NormalizedDataSource result =
                DatabaseUrlEnvironmentPostProcessor.normalize("postgres://onlyuser@host/db", null, null);

        assertThat(result.url()).isEqualTo("jdbc:postgresql://host/db");
        assertThat(result.username()).isEqualTo("onlyuser");
        assertThat(result.password()).isNull();
    }

    @Test
    void explicitCredentialsWinOverUrlUserInfo() {
        DatabaseUrlEnvironmentPostProcessor.NormalizedDataSource result =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgres://urluser:urlpass@host/db", "envuser", "envpass");

        assertThat(result.url()).isEqualTo("jdbc:postgresql://host/db");
        assertThat(result.username()).isNull();
        assertThat(result.password()).isNull();
    }

    @Test
    void leavesJdbcUrlsUntouched() {
        assertThat(DatabaseUrlEnvironmentPostProcessor.normalize(
                "jdbc:postgresql://localhost:5432/idve_db", null, null)).isNull();
    }

    @Test
    void returnsNullForMissingOrUnsupportedUrls() {
        assertThat(DatabaseUrlEnvironmentPostProcessor.normalize(null, null, null)).isNull();
        assertThat(DatabaseUrlEnvironmentPostProcessor.normalize("", null, null)).isNull();
        assertThat(DatabaseUrlEnvironmentPostProcessor.normalize("mysql://host/db", null, null)).isNull();
    }
}
