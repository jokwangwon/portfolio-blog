package com.portfolio.portal.exception;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.portal.ai.AiServiceException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"))
                .toList();

        return ResponseEntity.badRequest().body(errorBody("VALIDATION_ERROR", "입력값 검증 실패", errors));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(errorBody("BAD_REQUEST", ex.getMessage(), null));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(errorBody("AUTH_INVALID_CREDENTIALS", "아이디 또는 비밀번호가 올바르지 않습니다", null));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(errorBody(ex.getErrorCode(), ex.getMessage(), null));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(errorBody(ex.getErrorCode(), ex.getMessage(), null));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody(ex.getErrorCode(), ex.getMessage(), null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody("AUTH_ACCESS_DENIED", "접근 권한이 없습니다", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody("SYSTEM_INTERNAL_ERROR", "서버 내부 오류가 발생했습니다", null));
    }

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<Map<String, Object>> handleAiServiceException(AiServiceException e) {
        log.error("AI 서비스 오류: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(errorBody("AI_SERVICE_UNAVAILABLE", e.getMessage(), null));
    }

    private Map<String, Object> errorBody(String code, String message, List<Map<String, String>> errors) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", code);
        body.put("message", message);
        body.put("timestamp", LocalDateTime.now().toString());
        if (errors != null) {
            body.put("errors", errors);
        }
        return body;
    }
}
