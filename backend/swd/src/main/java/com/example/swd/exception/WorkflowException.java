package com.example.swd.exception;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

public class WorkflowException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fieldErrors;
    private final List<String> blockers;

    public WorkflowException(HttpStatus status, String code, String message) {
        this(status, code, message, Map.of(), List.of());
    }

    public WorkflowException(HttpStatus status, String code, String message,
                             Map<String, String> fieldErrors, List<String> blockers) {
        super(message);
        this.status = status;
        this.code = code;
        this.fieldErrors = Map.copyOf(fieldErrors);
        this.blockers = List.copyOf(blockers);
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public Map<String, String> getFieldErrors() { return fieldErrors; }
    public List<String> getBlockers() { return blockers; }
}
