package com.portfolio.module.benchmark.service;

import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.benchmark.AiModel;
import com.portfolio.domain.benchmark.BenchmarkResult;
import com.portfolio.domain.benchmark.repository.AiModelRepository;
import com.portfolio.domain.benchmark.repository.BenchmarkResultRepository;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.benchmark.dto.AiModelResponse;
import com.portfolio.module.benchmark.dto.BenchmarkResultRequest;
import com.portfolio.module.benchmark.dto.BenchmarkResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class BenchmarkService {

    private final BenchmarkResultRepository benchmarkResultRepository;
    private final AiModelRepository aiModelRepository;
    private final UserRepository userRepository;

    public Page<BenchmarkResultResponse> getResults(Long modelId, Pageable pageable) {
        if (modelId != null) {
            log.info("모델 ID {}로 벤치마크 결과 조회", modelId);
            return benchmarkResultRepository.findByModelId(modelId, pageable)
                    .map(BenchmarkResultResponse::from);
        }
        log.info("전체 벤치마크 결과 조회");
        return benchmarkResultRepository.findAll(pageable)
                .map(BenchmarkResultResponse::from);
    }

    @Transactional
    public BenchmarkResultResponse createResult(String username, BenchmarkResultRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        AiModel model = aiModelRepository.findById(request.modelId())
                .orElseThrow(() -> new ResourceNotFoundException("MODEL_NOT_FOUND", "AI 모델을 찾을 수 없습니다"));

        BenchmarkResult result = BenchmarkResult.builder()
                .model(model)
                .user(user)
                .promptTokens(request.promptTokens())
                .generatedTokens(request.generatedTokens())
                .totalDuration(request.totalDuration())
                .tokensPerSecond(request.tokensPerSecond())
                .firstTokenLatency(request.firstTokenLatency())
                .avgGpuUtilization(request.avgGpuUtilization())
                .maxMemoryUsed(request.maxMemoryUsed())
                .avgTemperature(request.avgTemperature())
                .build();

        benchmarkResultRepository.save(result);
        log.info("벤치마크 결과 저장 완료 - 모델: {}, 사용자: {}", model.getName(), username);

        return BenchmarkResultResponse.from(result);
    }

    public List<AiModelResponse> getModels() {
        log.info("전체 AI 모델 목록 조회");
        return aiModelRepository.findAll().stream()
                .map(AiModelResponse::from)
                .toList();
    }
}
