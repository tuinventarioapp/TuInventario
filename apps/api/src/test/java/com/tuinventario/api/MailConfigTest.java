package com.tuinventario.api;

import com.tuinventario.api.config.MailConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MailConfigTest {

    @Test
    void shouldNormalizeBrevoRelayAliasToCanonicalHost() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.mail.host", "smtp-relay.brevo.com")
                .withProperty("spring.mail.port", "587")
                .withProperty("spring.mail.username", "user")
                .withProperty("spring.mail.password", "pass");

        JavaMailSenderImpl sender = (JavaMailSenderImpl) new MailConfig().javaMailSender(environment);

        assertEquals("smtp-relay.sendinblue.com", sender.getHost());
        assertEquals(587, sender.getPort());
        assertEquals("user", sender.getUsername());
    }
}
