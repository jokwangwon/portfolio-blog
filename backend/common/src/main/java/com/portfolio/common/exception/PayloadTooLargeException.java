package com.portfolio.common.exception;

public class PayloadTooLargeException extends RuntimeException {
    public PayloadTooLargeException() { super("이미지는 10MB 이하로 추가해 주세요"); }
}
