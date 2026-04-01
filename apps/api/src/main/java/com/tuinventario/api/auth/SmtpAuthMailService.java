package com.tuinventario.api.auth;

import com.tuinventario.api.config.AppProperties;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SmtpAuthMailService implements AuthMailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    @Override
    public void sendRegistrationVerificationCode(String recipientEmail, String recipientName, String code, String organizationName) {
        String safeName = recipientName == null || recipientName.isBlank() ? "equipo" : recipientName.trim();
        String safeOrganization = organizationName == null || organizationName.isBlank() ? "tu organizacion" : organizationName.trim();
        String subject = "Verifica tu cuenta de TuInventario";
        String body = """
                Hola %s,

                Recibimos una solicitud para crear la cuenta administradora de %s en TuInventario.

                Tu codigo de verificacion es:
                %s

                Este codigo vence en 15 minutos.

                Si no solicitaste esta cuenta, ignora este correo.

                Equipo TuInventario
                """
                .formatted(safeName, safeOrganization, code);

        sendPlainText(recipientEmail, subject, body);
    }

    @Override
    public void sendPasswordResetCode(String recipientEmail, String recipientName, String code, String resetLink) {
        String safeName = recipientName == null || recipientName.isBlank() ? "equipo" : recipientName.trim();
        String subject = "Codigo para restablecer tu contrasena de TuInventario";
        String body = """
                Hola %s,

                Recibimos una solicitud para restablecer la contrasena de tu cuenta administradora en TuInventario.

                Tu codigo es:
                %s

                Tambien puedes abrir este enlace para continuar:
                %s

                Este codigo vence en 15 minutos.

                Si no solicitaste este cambio, ignora este correo.

                Equipo TuInventario
                """
                .formatted(safeName, code, resetLink);

        sendPlainText(recipientEmail, subject, body);
    }

    private void sendPlainText(String recipientEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(appProperties.mailFrom(), appProperties.mailFromName());
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible enviar el correo de autenticacion.", exception);
        }
    }
}
