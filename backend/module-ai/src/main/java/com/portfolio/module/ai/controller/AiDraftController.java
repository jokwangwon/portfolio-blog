package com.portfolio.module.ai.controller;

import com.portfolio.module.ai.dto.DraftRequest;
import com.portfolio.module.ai.dto.DraftResponse;
import com.portfolio.module.ai.service.LlmService;
import com.portfolio.module.ai.service.NotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/portal/ai")
@RequiredArgsConstructor
public class AiDraftController {

    private final NotionService notionService;
    private final LlmService llmService;

    @PostMapping("/generate-draft")
    public ResponseEntity<DraftResponse> generateDraft(
            @Valid @RequestBody DraftRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI 초안 생성 요청 - user: {}, pageId: {}",
                userDetails.getUsername(), request.getNotionPageId());

        long startTime = System.currentTimeMillis();

        // Notion 페이지 읽기 -> LLM 초안 생성 (reactive chain)
        String content = notionService.readPage(request.getNotionPageId())
                .flatMap(notionContent ->
                        llmService.generateDraft(notionContent, request.getInstructions()))
                .block(); // Controller 레벨에서 blocking 변환

        long durationMs = System.currentTimeMillis() - startTime;

        DraftResponse response = DraftResponse.builder()
                .content(content)
                .provider(llmService.getProvider())
                .durationMs(durationMs)
                .build();

        log.info("AI 초안 생성 완료 - {}ms, provider: {}", durationMs, response.getProvider());

        return ResponseEntity.ok(response);
    }
}
