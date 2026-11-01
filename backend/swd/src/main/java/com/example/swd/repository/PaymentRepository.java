package com.example.swd.repository;

import com.example.swd.entity.billing.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentReference(String paymentReference);
    Optional<Payment> findByProviderAndProviderTransactionId(String provider, String providerTransactionId);
}

