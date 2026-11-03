package com.example.swd.integration;

import com.example.swd.exception.WorkflowException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class RegistrationEmailService {
    private final JavaMailSender sender;
    private final String host;
    private final String from;

    public RegistrationEmailService(JavaMailSender sender, @Value("${spring.mail.host:}") String host,
            @Value("${app.mail.from:}") String from) {
        this.sender = sender;
        this.host = host;
        this.from = from;
    }

    public void requireConfigured() {
        if (host == null || host.isBlank() || from == null || from.isBlank())
            throw unavailable();
    }

    public void sendOtp(String email, String otp) {
        requireConfigured();
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Xác thực tài khoản SWD Care");
        message.setText("Xin chào,\n\nMã OTP xác thực đăng ký SWD Care của bạn là: " + otp
                + "\n\nMã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với người khác."
                + "\nNếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.");
        try {
            sender.send(message);
        } catch (MailException ex) {
            System.out.println(ex.getMessage());
            throw unavailable();
        }
    }

    private static WorkflowException unavailable() {
        return new WorkflowException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP_UNAVAILABLE",
                "Chưa gửi được email xác thực. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.");
    }
}
