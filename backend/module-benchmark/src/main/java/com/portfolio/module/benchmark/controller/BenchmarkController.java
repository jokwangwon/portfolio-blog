package com.portfolio.module.benchmark.controller;

import com.portfolio.module.benchmark.dto.AiModelResponse;
import com.portfolio.module.benchmark.dto.BenchmarkResultRequest;
import com.portfolio.module.benchmark.dto.BenchmarkResultResponse;
import com.portfolio.module.benchmark.service.BenchmarkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portal/benchmarks")
@RequiredArgsConstructor
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    @GetMapping
    public ResponseEntity<Page<BenchmarkResultResponse>> getResults(
            @RequestParam(required = false) Long modelId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(benchmarkService.getResults(modelId, pageable));
    }

    @PostMapping
    public ResponseEntity<BenchmarkResultResponse> createResult(
            @Valid @RequestBody BenchmarkResultRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        BenchmarkResultResponse response = benchmarkService.createResult(
                userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/models")
    public ResponseEntity<List<AiModelResponse>> getModels() {
        return ResponseEntity.ok(benchmarkService.getModels());
    }
}
