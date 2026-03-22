package com.tuinventario.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String baseUrl,
        Integer accessTokenMinutes,
        Integer refreshTokenDays,
        String jwtAccessSecret,
        String jwtRefreshSecret,
        String frontendOrigin
) {
}
