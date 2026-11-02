package com.example.swd.config;

import com.example.swd.integration.ClinicalAttachmentStorage;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class ClinicalUploadConfig {
    @Bean
    MultipartConfigElement multipartConfigElement() {
        return new MultipartConfigElement("", ClinicalAttachmentStorage.MAX_BYTES, 11L * 1024 * 1024, 0);
    }
}
