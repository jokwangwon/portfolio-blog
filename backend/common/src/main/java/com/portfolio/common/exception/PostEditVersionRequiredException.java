package com.portfolio.common.exception;
public class PostEditVersionRequiredException extends RuntimeException { public PostEditVersionRequiredException() { super("편집 버전이 없습니다. 내용을 보관한 뒤 최신 글을 불러와 주세요."); } }
