package com.example.swd.service;
import com.example.swd.config.RegistrationEmailService;

import com.example.swd.exception.WorkflowException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RegistrationEmailServiceTest {
    @Test void sendsOtpWithFromAndFiveMinuteInstructions() {
        JavaMailSender sender = mock(JavaMailSender.class);
        new RegistrationEmailService(sender, "localhost", "care@example.test").sendOtp("patient@example.test", "123456");
        var message = ArgumentCaptor.forClass(SimpleMailMessage.class); verify(sender).send(message.capture());
        assertEquals("care@example.test", message.getValue().getFrom());
        assertArrayEquals(new String[]{"patient@example.test"}, message.getValue().getTo());
        assertTrue(message.getValue().getText().contains("123456")); assertTrue(message.getValue().getText().contains("5 phút"));
    }
    @Test void missingConfigurationDoesNotSendMail() {
        JavaMailSender sender = mock(JavaMailSender.class);
        var error = assertThrows(WorkflowException.class, () -> new RegistrationEmailService(sender, "", "").sendOtp("patient@example.test", "123456"));
        assertEquals(503, error.getStatus().value()); assertEquals("SMTP_UNAVAILABLE", error.getCode()); verifyNoInteractions(sender);
    }
    @Test void smtpFailureReturnsSafeErrorWithoutCredentialsOrOtp() {
        JavaMailSender sender = mock(JavaMailSender.class);
        doThrow(new MailSendException("secret credentials 123456")).when(sender).send(any(SimpleMailMessage.class));
        var error = assertThrows(WorkflowException.class, () -> new RegistrationEmailService(sender, "localhost", "care@example.test").sendOtp("patient@example.test", "123456"));
        assertEquals(503, error.getStatus().value()); assertFalse(error.getMessage().contains("123456")); assertFalse(error.getMessage().contains("secret"));
    }
}
