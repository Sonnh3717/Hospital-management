package com.example.swd.service.impl;

import com.example.swd.entity.common.enums.Priority;
import com.example.swd.exception.WorkflowException;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;

final class ClinicalWorkflowSupport {
    private ClinicalWorkflowSupport() {}

    static Priority priority(String value) {
        try {
            return Priority.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw invalid("priority", "Mức ưu tiên phải là ROUTINE hoặc URGENT.");
        }
    }

    static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    static WorkflowException missing(String name) {
        return new WorkflowException(HttpStatus.NOT_FOUND, "NOT_FOUND", name + " không tồn tại.");
    }

    static WorkflowException forbidden() {
        return new WorkflowException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền truy cập dữ liệu này.");
    }

    static WorkflowException conflict(String code, String message) {
        return new WorkflowException(HttpStatus.CONFLICT, code, message);
    }

    static WorkflowException invalid(String field, String message) {
        return new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message, Map.of(field, message), List.of());
    }
}
