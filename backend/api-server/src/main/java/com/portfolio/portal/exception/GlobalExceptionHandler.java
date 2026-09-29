package com.portfolio.portal.exception;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.portal.ai.AiServiceException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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

    @ExceptionHandler({com.portfolio.common.exception.PayloadTooLargeException.class,
            org.springframework.web.multipart.MaxUploadSizeExceededException.class})
    public ResponseEntity<Map<String, Object>> handleUploadLimit(Exception ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(errorBody("IMAGE_TOO_LARGE", "이미지는 10MB 이하로 추가해 주세요", null));
    }

    @ExceptionHandler(org.springframework.web.multipart.support.MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, Object>> handleMissingFile(Exception ex) {
        return ResponseEntity.badRequest().body(errorBody("BAD_REQUEST", "이미지 파일을 선택해 주세요", null));
    }

    @ExceptionHandler(com.portfolio.common.exception.PostEditConflictException.class)
    public ResponseEntity<Map<String, Object>> handleEditConflict(Exception ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody("POST_EDIT_CONFLICT", ex.getMessage(), null));
    }
    @ExceptionHandler(com.portfolio.common.exception.PostEditVersionRequiredException.class)
    public ResponseEntity<Map<String, Object>> handleEditVersionRequired(Exception ex) {
        return ResponseEntity.badRequest().body(errorBody("POST_EDIT_VERSION_REQUIRED", ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"))
                .toList();

        return ResponseEntity.badRequest().body(errorBody("VALIDATION_ERROR", "입력값 검증 실패", errors));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> handleMalformedRequest(Exception ex) {
        return ResponseEntity.badRequest().body(errorBody("BAD_REQUEST", "요청 형식이 올바르지 않습니다", null));
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
