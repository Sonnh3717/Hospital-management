package com.example.swd.exception;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ErrorView(String code, String message, Map<String, String> fieldErrors, List<String> blockers) {}

    @ExceptionHandler(WorkflowException.class)
    ResponseEntity<ErrorView> workflow(WorkflowException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErrorView(ex.getCode(), ex.getMessage(),
                ex.getFieldErrors(), ex.getBlockers()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorView> validation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vui lòng kiểm tra thông tin đã nhập.", fields);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorView> malformed(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Dữ liệu gửi lên không hợp lệ.", Map.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorView> denied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.", Map.of());
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ErrorView> unauthorized(AuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Vui lòng đăng nhập lại.", Map.of());
    }

    @ExceptionHandler({DataIntegrityViolationException.class, PessimisticLockingFailureException.class})
    ResponseEntity<ErrorView> conflict(Exception ex) {
        return error(HttpStatus.CONFLICT, "CONCURRENT_CHANGE", "Dữ liệu đã thay đổi hoặc trùng với bản ghi hiện có. Vui lòng tải lại.", Map.of());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ErrorView> largeUpload(MaxUploadSizeExceededException ex) {
        return error(HttpStatus.BAD_REQUEST, "ATTACHMENT_TOO_LARGE", "Tệp đính kèm tối đa 10 MiB.", Map.of("attachment", "Tệp đính kèm tối đa 10 MiB."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorView> unexpected(Exception ex) {
        log.error("Unexpected workflow failure", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Không thể xử lý yêu cầu. Vui lòng thử lại.", Map.of());
    }

    private ResponseEntity<ErrorView> error(HttpStatus status, String code, String message, Map<String, String> fields) {
        return ResponseEntity.status(status).body(new ErrorView(code, message, fields, List.of()));
    }
}
