package com.portfolio.module.blog.service;

import com.portfolio.common.exception.PayloadTooLargeException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.blog.Attachment;
import com.portfolio.domain.blog.Post;
import com.portfolio.domain.blog.repository.AttachmentRepository;
import com.portfolio.domain.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.IIOImage;
import javax.imageio.stream.MemoryCacheImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class AttachmentService {
    public static final long MAX_BYTES = 10 * 1024 * 1024;
    private final AttachmentRepository attachments;
    private final UserRepository users;
    private final AttachmentReferences references;
    private final Path directory;

    public AttachmentService(AttachmentRepository attachments, UserRepository users, AttachmentReferences references,
                             @Value("${app.attachments.directory:./data/attachments}") String directory) throws IOException {
        this.attachments = attachments; this.users = users; this.references = references;
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(this.directory);
    }
    public record Uploaded(UUID id, String url, String mediaType, long byteSize, int width, int height) {}
    public record ImageFile(String mediaType, byte[] bytes) {}
    private record Encoded(byte[] bytes, String extension, String mediaType, int width, int height) {}

    @Transactional
    public Uploaded upload(MultipartFile file, String username) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("PNG 또는 JPEG 이미지를 선택해 주세요");
        if (file.getSize() > MAX_BYTES) throw new PayloadTooLargeException();
        Encoded encoded = encode(file);
        var owner = users.findByUsername(username).orElseThrow(AttachmentService::notFound);
        UUID id = UUID.randomUUID();
        String key = id + "." + encoded.extension();
        Path target = directory.resolve(key);
        Files.write(target, encoded.bytes(), StandardOpenOption.CREATE_NEW);
        // Uploads have their own transaction; a later post failure leaves an owner-only upload for recovery.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    try { Files.deleteIfExists(target); }
                    catch (IOException ignored) { /* Never expose an orphan: without metadata it cannot be served. */ }
                }
            }
        });
        var attachment = new Attachment(id, owner, key, encoded.mediaType(), encoded.bytes().length,
                encoded.width(), encoded.height(), digest(encoded.bytes()));
        attachments.saveAndFlush(attachment);
        return new Uploaded(id, "/api/portal/attachments/" + id, encoded.mediaType(), encoded.bytes().length,
                encoded.width(), encoded.height());
    }

    @Transactional(readOnly = true)
    public ImageFile read(UUID id, String username) throws IOException {
        var attachment = attachments.findById(id).orElseThrow(AttachmentService::notFound);
        boolean owner = attachment.getOwner().getUsername().equals(username);
        boolean visible = attachment.getPost() != null && attachment.getPost().isPubliclyReadable();
        if (!owner && !visible) throw notFound();
        Path path = directory.resolve(attachment.getStorageKey()).normalize();
        if (!path.getParent().equals(directory) || !Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)) throw notFound();
        return new ImageFile(attachment.getMediaType(), Files.readAllBytes(path));
    }

    @Transactional
    public void synchronize(Post post, String content) {
        Set<UUID> desired = references.extract(content);
        Set<UUID> locks = new TreeSet<>(desired);
        attachments.findAllByPostId(post.getId()).forEach(a -> locks.add(a.getId()));
        for (UUID id : locks) {
            Attachment attachment = attachments.findForUpdate(id)
                    .orElseThrow(() -> new IllegalArgumentException("사용할 수 없는 첨부 이미지입니다"));
            if (desired.contains(id)) {
                if (!attachment.getOwner().getId().equals(post.getAuthor().getId()) ||
                        (attachment.getPost() != null && !attachment.getPost().getId().equals(post.getId())))
                    throw new IllegalArgumentException("다른 글이나 사용자의 첨부 이미지는 연결할 수 없습니다");
                attachment.attachTo(post);
            } else if (attachment.getPost() != null && attachment.getPost().getId().equals(post.getId())) {
                attachment.attachTo(null);
            }
        }
    }

    private Encoded encode(MultipartFile file) throws IOException {
        try (var input = new MemoryCacheImageInputStream(file.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("읽을 수 있는 PNG 또는 JPEG 이미지가 아닙니다");
            var reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals("png") && !format.equals("jpeg")) throw new IllegalArgumentException("PNG와 JPEG 이미지만 지원합니다");
                reader.setInput(input, true, true);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 8192 || height > 8192 || (long) width * height > 20_000_000)
                    throw new IllegalArgumentException("이미지는 한 변 8192px, 총 2000만 픽셀 이하여야 합니다");
                BufferedImage image = reader.read(0);
                var buffer = new ByteArrayOutputStream();
                var writer = ImageIO.getImageWritersByFormatName(format).next();
                try (var output = new MemoryCacheImageOutputStream(buffer)) {
                    writer.setOutput(output);
                    var params = writer.getDefaultWriteParam();
                    if (format.equals("jpeg") && params.canWriteCompressed()) {
                        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT); params.setCompressionQuality(0.92f);
                    }
                    writer.write(null, new IIOImage(image, null, null), params);
                } finally { writer.dispose(); image.flush(); }
                byte[] bytes = buffer.toByteArray();
                if (bytes.length > MAX_BYTES) throw new PayloadTooLargeException();
                return new Encoded(bytes, format.equals("jpeg") ? "jpg" : "png", "image/" + format, width, height);
            } finally { reader.dispose(); }
        } catch (javax.imageio.IIOException ex) {
            throw new IllegalArgumentException("손상된 이미지입니다. PNG 또는 JPEG 파일을 다시 선택해 주세요");
        }
    }
    private static String digest(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
    private static ResourceNotFoundException notFound() {
        return new ResourceNotFoundException("ATTACHMENT_NOT_FOUND", "이미지를 찾을 수 없습니다");
    }
}
