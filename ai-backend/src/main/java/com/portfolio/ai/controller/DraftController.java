package com.portfolio.ai.controller;

import com.portfolio.ai.dto.DraftRequest;
import com.portfolio.ai.dto.DraftResponse;
import com.portfolio.ai.service.LlmService;
import com.portfolio.ai.service.NotionService;
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
public class DraftController {

    private final NotionService notionService;
    private final LlmService llmService;

    @PostMapping("/generate-draft")
    public ResponseEntity<DraftResponse> generateDraft(@Valid @RequestBody DraftRequest request) {
        log.info("초안 생성 요청: pageId={}", request.getNotionPageId());

        long start = System.currentTimeMillis();

        String content = notionService.readPage(request.getNotionPageId())
                .flatMap(notionContent ->
                        llmService.generateDraft(notionContent, request.getInstructions()))
                .block();

        long durationMs = System.currentTimeMillis() - start;

        return ResponseEntity.ok(DraftResponse.builder()
                .content(content)
                .provider(llmService.getProvider())
                .durationMs(durationMs)
                .build());
    }
}
