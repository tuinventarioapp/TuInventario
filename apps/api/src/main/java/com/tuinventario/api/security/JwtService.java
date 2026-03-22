package com.tuinventario.api.security;

import com.tuinventario.api.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateAccessToken(UUID userId, UUID organizationId, String role, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "userId", userId.toString(),
                        "organizationId", organizationId.toString(),
                        "role", role
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(appProperties.accessTokenMinutes(), ChronoUnit.MINUTES)))
                .signWith(Keys.hmacShaKeyFor(appProperties.jwtAccessSecret().getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    public String generateRefreshToken(UUID userId, UUID organizationId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "userId", userId.toString(),
                        "organizationId", organizationId.toString()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(appProperties.refreshTokenDays(), ChronoUnit.DAYS)))
                .signWith(Keys.hmacShaKeyFor(appProperties.jwtRefreshSecret().getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(appProperties.jwtAccessSecret().getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(appProperties.jwtRefreshSecret().getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
