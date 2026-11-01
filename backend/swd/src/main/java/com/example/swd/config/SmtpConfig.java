package com.example.swd.config;

import java.time.Clock;
import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration(proxyBeanMethods = false)
@PropertySource("classpath:smtp.properties")
public class SmtpConfig {
    @Bean
    Clock registrationClock() { return Clock.systemUTC(); }

    @Bean
    JavaMailSender registrationMailSender(
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean auth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean startTls,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean requireTls,
            @Value("${spring.mail.properties.mail.smtp.ssl.enable:false}") boolean ssl) {
        var sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);
        sender.setDefaultEncoding("UTF-8");
        var properties = new Properties();
        properties.setProperty("mail.smtp.auth", Boolean.toString(auth));
        properties.setProperty("mail.smtp.starttls.enable", Boolean.toString(startTls));
        properties.setProperty("mail.smtp.starttls.required", Boolean.toString(requireTls));
        properties.setProperty("mail.smtp.ssl.enable", Boolean.toString(ssl));
        properties.setProperty("mail.smtp.connectiontimeout", "5000");
        properties.setProperty("mail.smtp.timeout", "5000");
        properties.setProperty("mail.smtp.writetimeout", "5000");
        sender.setJavaMailProperties(properties);
        return sender;
    }
}
