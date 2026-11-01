package com.example.swd.service;

import com.example.swd.dto.response.BookingCheckoutResponse;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.billing.Invoice;
import com.example.swd.entity.billing.Payment;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.AppointmentRepository;
import com.example.swd.repository.InvoiceRepository;
import com.example.swd.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayOSService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;

    @Value("${app.payos.client-id:demo-client-id}")
    private String clientId;

    @Value("${app.payos.api-key:demo-api-key}")
    private String apiKey;

    @Value("${app.payos.checksum-key:demo-checksum-key-12345678901234567890}")
    private String checksumKey;

    /**
     * Tạo đơn thanh toán và mã QR VietQR (payOS)
     */
    @Transactional
    public BookingCheckoutResponse createPaymentLink(Appointment appointment, BigDecimal amount, UserAccount account) {
        long orderCode = System.currentTimeMillis() % 100000000;
        String paymentRef = "PAYOS-" + orderCode;

        Payment payment = new Payment();
        payment.setInvoice(null); // Có thể null trước khi khám hoặc liên kết invoice đặt lịch
        payment.setInitiatedByAccount(account);
        payment.setPaymentReference(paymentRef);
        payment.setProvider("PAYOS");
        payment.setProviderTransactionId(String.valueOf(orderCode));
        payment.setAmount(amount);
        payment.setStatus(Payment.Status.PENDING);

        // Sinh link checkout payOS (mô phỏng chuẩn định dạng VietQR payOS)
        String checkoutUrl = "https://pay.payos.vn/web/" + orderCode;
        String qrCodeText = "00020101021238540010A000000727012400069704220110" + orderCode + "5303704540" + amount.intValue() + "5802VN62150811HOSPITAL" + appointment.getId() + "6304ABCD";

        paymentRepository.save(payment);

        return BookingCheckoutResponse.builder()
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .orderCode(orderCode)
                .amount(amount)
                .paymentStatus("PENDING")
                .checkoutUrl(checkoutUrl)
                .qrCodeText(qrCodeText)
                .build();
    }

    /**
     * Xử lý Webhook từ payOS gọi sang khi người bệnh thanh toán thành công
     */
    @Transactional
    public boolean processWebhook(Map<String, Object> webhookData) {
        log.info("Nhận webhook từ payOS: {}", webhookData);

        // Kiểm tra mã kết quả
        String code = String.valueOf(webhookData.getOrDefault("code", ""));
        if (!"00".equals(code) && !"SUCCESS".equalsIgnoreCase(code)) {
            log.warn("Giao dịch payOS không thành công với code: {}", code);
            return false;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) webhookData.get("data");
        if (data == null) return false;

        String orderCode = String.valueOf(data.get("orderCode"));
        var paymentOpt = paymentRepository.findByProviderAndProviderTransactionId("PAYOS", orderCode);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            payment.setStatus(Payment.Status.SUCCEEDED);
            payment.setCompletedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Kích hoạt cuộc hẹn tương ứng nếu đang chờ
            log.info("Thanh toán thành công cho orderCode: {}", orderCode);
            return true;
        }
        return false;
    }

    /**
     * Xác thực chữ ký HMAC SHA256 từ payOS
     */
    public boolean verifySignature(String rawData, String signature) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(rawData.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Lỗi xác thực chữ ký payOS", e);
            return false;
        }
    }
}

