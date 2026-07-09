package com.portfolio.module.registry.controller;

import com.portfolio.module.registry.dto.ServiceRegistryRequest;
import com.portfolio.module.registry.dto.ServiceStatusResponse;
import com.portfolio.module.registry.service.ServiceRegistryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portal/services")
@RequiredArgsConstructor
public class ServiceRegistryController {

    private final ServiceRegistryService serviceRegistryService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ServiceStatusResponse>> getAllServices() {
        return ResponseEntity.ok(serviceRegistryService.getAllServices());
    }

    @GetMapping("/{serviceName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ServiceStatusResponse> getService(@PathVariable String serviceName) {
        return ResponseEntity.ok(serviceRegistryService.getService(serviceName));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceStatusResponse> registerService(
            @Valid @RequestBody ServiceRegistryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceRegistryService.registerService(request));
    }

    @DeleteMapping("/{serviceName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateService(@PathVariable String serviceName) {
        serviceRegistryService.deactivateService(serviceName);
        return ResponseEntity.noContent().build();
    }
}
