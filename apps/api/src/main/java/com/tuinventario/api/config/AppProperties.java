package com.tuinventario.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String env,
        String baseUrl,
        Integer accessTokenMinutes,
        Integer refreshTokenDays,
        String jwtAccessSecret,
        String jwtRefreshSecret,
        Boolean demoSeedEnabled,
        String frontendOrigin,
        String mailFrom,
        String mailFromName
) {
}
