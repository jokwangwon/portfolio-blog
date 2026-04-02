package com.portfolio.portal.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/portal/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiClient aiClient;

    @PostMapping("/summarize")
    public ResponseEntity<AiSummarizeResponse> summarize(
            @Valid @RequestBody SummarizeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI 요약 요청 - user: {}, maxLength: {}",
                userDetails.getUsername(), request.getMaxLength());

        AiSummarizeResponse response = aiClient.summarize(
                request.getContent(), request.getTitle(), request.getMaxLength());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-draft")
    public ResponseEntity<AiDraftResponse> generateDraft(
            @Valid @RequestBody DraftRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI 초안 생성 요청 - user: {}, pageId: {}",
                userDetails.getUsername(), request.getNotionPageId());

        AiDraftResponse response = aiClient.generateDraft(
                request.getNotionPageId(), request.getInstructions());

        return ResponseEntity.ok(response);
    }

    @Getter
    @Setter
    static class SummarizeRequest {
        @NotBlank(message = "본문 내용은 필수입니다")
        private String content;
        private String title;
        private int maxLength = 200;
    }

    @Getter
    @Setter
    static class DraftRequest {
        @NotBlank(message = "Notion 페이지 ID는 필수입니다")
        private String notionPageId;
        private String instructions;
    }
}
