package com.tuinventario.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.core.env.Environment;

import java.nio.charset.StandardCharsets;
import java.util.Properties;

@Configuration
public class MailConfig {

    private static final String BREVO_RELAY_ALIAS = "smtp-relay.brevo.com";
    private static final String BREVO_RELAY_CANONICAL = "smtp-relay.sendinblue.com";

    @Bean
    public JavaMailSender javaMailSender(Environment environment) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(resolveHost(environment.getProperty("spring.mail.host")));
        sender.setPort(environment.getProperty("spring.mail.port", Integer.class, 587));
        sender.setUsername(environment.getProperty("spring.mail.username"));
        sender.setPassword(environment.getProperty("spring.mail.password"));
        sender.setProtocol(environment.getProperty("spring.mail.protocol", "smtp"));
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        Properties properties = new Properties();
        properties.setProperty("mail.smtp.auth", environment.getProperty("spring.mail.properties.mail.smtp.auth", "true"));
        properties.setProperty("mail.smtp.starttls.enable", environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "true"));
        sender.setJavaMailProperties(properties);
        return sender;
    }

    private String resolveHost(String configuredHost) {
        if (configuredHost == null || configuredHost.isBlank()) {
            return configuredHost;
        }
        if (BREVO_RELAY_ALIAS.equalsIgnoreCase(configuredHost.trim())) {
            return BREVO_RELAY_CANONICAL;
        }
        return configuredHost.trim();
    }
}
