package com.example.swd.config;

import com.example.swd.service.ClinicalAttachmentStorage;
import jakarta.servlet.MultipartConfigElement;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.servlet.autoconfigure.MultipartAutoConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.web.multipart.MultipartResolver;
import static org.assertj.core.api.Assertions.assertThat;

class ClinicalUploadConfigTest {
    @Test void servletUsesClinicalLimitsInsteadOfBootOneMiBDefault() {
        new WebApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(MultipartAutoConfiguration.class))
            .withUserConfiguration(ClinicalUploadConfig.class)
            .run(context->{
                assertThat(context).hasSingleBean(MultipartConfigElement.class).hasSingleBean(MultipartResolver.class);
                var limits=context.getBean(MultipartConfigElement.class);
                assertThat(limits.getMaxFileSize()).isEqualTo(ClinicalAttachmentStorage.MAX_BYTES);
                assertThat(limits.getMaxRequestSize()).isEqualTo(11L*1024*1024).isGreaterThan(limits.getMaxFileSize());
            });
    }
}
