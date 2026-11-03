package com.example.swd.dto.response;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    @Builder.Default
    private int code = 200;

    @Builder.Default
    private boolean success = true;

    private String message;
    private T data;

    @Builder.Default
    private String timestamp = Instant.now().toString();

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .success(true)
                .message("Thành công")
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .success(true)
                .message(message)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> of(int code, boolean success, String message, T data) {
        return ApiResponse.<T>builder()
                .code(code)
                .success(success)
                .message(message)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }
}
