package com.example.swd.config;

import com.example.swd.service.ClinicalAttachmentStorage;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class ClinicalUploadConfig {
    @Bean
    MultipartConfigElement multipartConfigElement() {
        // Allow the documented 10 MiB report plus multipart boundaries and result text.
        // This bean also prevents Spring Boot's default 1 MiB file limit from rejecting
        // valid reports.
        return new MultipartConfigElement("", ClinicalAttachmentStorage.MAX_BYTES, 11L * 1024 * 1024, 0);
    }
}
