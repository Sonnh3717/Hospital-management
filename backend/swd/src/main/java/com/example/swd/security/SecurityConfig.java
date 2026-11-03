package com.example.swd.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final SessionAuthenticationFilter sessionAuthenticationFilter;

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public FilterRegistrationBean<SessionAuthenticationFilter> sessionAuthenticationFilterRegistration(
                        SessionAuthenticationFilter filter) {
                FilterRegistrationBean<SessionAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
                registration.setEnabled(false);
                return registration;
        }

        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                return http
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .exceptionHandling(errors -> errors
                                                .authenticationEntryPoint((request, response,
                                                                exception) -> SecurityResponses.unauthorized(response))
                                                .accessDeniedHandler((request, response, exception) -> SecurityResponses
                                                                .forbidden(response)))
                                .authorizeHttpRequests(authorize -> authorize
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                                                .requestMatchers("/api/public/**").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/patients/register", "/api/patients/send-otp", "/api/patients/verify-otp", "/api/patients/complete-profile").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/patients/check-username").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/appointments/available-slots").permitAll()
                                                .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
                                                .requestMatchers("/api/reception/**").hasRole("RECEPTIONIST")
                                                .requestMatchers("/api/doctor/**").hasRole("DOCTOR")
                                                .requestMatchers("/api/services/**").hasRole("MEDICAL_SERVICE_STAFF")
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/manager/**").hasRole("MANAGER")
                                                .requestMatchers("/api/patient/**").hasRole("PATIENT")
                                                .anyRequest().authenticated())
                                .addFilterBefore(sessionAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class)
                                .build();
        }
}
