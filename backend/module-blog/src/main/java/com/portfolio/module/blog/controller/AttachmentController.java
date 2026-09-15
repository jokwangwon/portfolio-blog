package com.portfolio.module.blog.controller;

import com.portfolio.module.blog.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/portal/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    private final AttachmentService service;
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentService.Uploaded> upload(@RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(service.upload(file, user.getUsername()));
    }
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> image(@PathVariable UUID id, @AuthenticationPrincipal UserDetails user) throws IOException {
        var image = service.read(id, user == null ? null : user.getUsername());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(image.mediaType().equals("image/png") ? "image.png" : "image.jpg").build().toString())
                .contentType(MediaType.parseMediaType(image.mediaType())).contentLength(image.bytes().length).body(image.bytes());
    }
}
