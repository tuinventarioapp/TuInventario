package com.tuinventario.api.auth;

public interface AuthMailService {

    void sendRegistrationVerificationCode(String recipientEmail, String recipientName, String code, String organizationName);

    void sendPasswordResetCode(String recipientEmail, String recipientName, String code, String resetLink);
}
