package com.example.swd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SwdApplication {
    public static void main(String[] args) {
        SpringApplication.run(SwdApplication.class, args);
    }
}
