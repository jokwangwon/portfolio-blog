package com.portfolio.common.exception;
public class PostEditConflictException extends RuntimeException { public PostEditConflictException() { super("다른 곳에서 글이 변경되었습니다. 최신 글과 비교한 뒤 저장해 주세요."); } }
