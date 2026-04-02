package com.portfolio.ai.controller;

import com.portfolio.ai.dto.SummarizeRequest;
import com.portfolio.ai.dto.SummarizeResponse;
import com.portfolio.ai.service.SummarizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class SummarizeController {

    private final SummarizationService summarizationService;

    @PostMapping("/summarize")
    public ResponseEntity<SummarizeResponse> summarize(@Valid @RequestBody SummarizeRequest request) {
        log.info("요약 요청: maxLength={}", request.getMaxLength());

        long start = System.currentTimeMillis();
        String summary = summarizationService.summarize(
                request.getContent(), request.getTitle(), request.getMaxLength());
        long durationMs = System.currentTimeMillis() - start;

        return ResponseEntity.ok(new SummarizeResponse(
                summary, summarizationService.getProvider(), durationMs));
    }
}
