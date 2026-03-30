package com.portfolio.portal.exception;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Validation 예외 시 400과 에러 목록을 반환한다")
    void handleValidation() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "name", "필수입니다"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsKey("errors");
        assertThat(response.getBody().get("code")).isEqualTo("VALIDATION_ERROR");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> errors = (List<Map<String, String>>) response.getBody().get("errors");
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0).get("field")).isEqualTo("name");
    }

    @Test
    @DisplayName("IllegalArgumentException 시 400을 반환한다")
    void handleIllegalArgument() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleIllegalArgument(new IllegalArgumentException("잘못된 입력"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("code")).isEqualTo("BAD_REQUEST");
        assertThat(response.getBody().get("message")).isEqualTo("잘못된 입력");
    }

    @Test
    @DisplayName("BadCredentialsException 시 401을 반환한다")
    void handleBadCredentials() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleBadCredentials(new BadCredentialsException("bad"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().get("code")).isEqualTo("AUTH_INVALID_CREDENTIALS");
    }

    @Test
    @DisplayName("ResourceNotFoundException 시 404를 반환한다")
    void handleNotFound() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleNotFound(new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("code")).isEqualTo("POST_NOT_FOUND");
    }

    @Test
    @DisplayName("DuplicateResourceException 시 409를 반환한다")
    void handleDuplicate() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleDuplicate(new DuplicateResourceException("DUPLICATE", "중복"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("code")).isEqualTo("DUPLICATE");
    }

    @Test
    @DisplayName("ForbiddenException 시 403을 반환한다")
    void handleForbidden() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleForbidden(new ForbiddenException("FORBIDDEN", "권한 없음"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().get("code")).isEqualTo("FORBIDDEN");
    }

    @Test
    @DisplayName("일반 Exception 시 500을 반환한다")
    void handleGeneral() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleGeneral(new RuntimeException("unexpected"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().get("code")).isEqualTo("SYSTEM_INTERNAL_ERROR");
    }

    @Test
    @DisplayName("모든 에러 응답에 timestamp가 포함된다")
    void allResponsesContainTimestamp() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleIllegalArgument(new IllegalArgumentException("test"));

        assertThat(response.getBody()).containsKey("timestamp");
    }
}
