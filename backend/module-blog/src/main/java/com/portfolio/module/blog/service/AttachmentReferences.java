package com.portfolio.module.blog.service;

import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class AttachmentReferences {
    private static final String PREFIX = "/api/portal/attachments/";
    private static final Pattern CANONICAL = Pattern.compile("^/api/portal/attachments/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$");
    private final Parser parser = Parser.builder().build();
    private final HtmlRenderer renderer = HtmlRenderer.builder().build();

    public Set<UUID> extract(String content) {
        Set<UUID> ids = new TreeSet<>();
        for (String source : Jsoup.parseBodyFragment(renderer.render(parser.parse(content))).select("img[src]").eachAttr("src")) {
            var match = CANONICAL.matcher(source);
            if (match.matches()) { ids.add(UUID.fromString(match.group(1))); continue; }
            if (source.startsWith("data:") || source.startsWith("blob:"))
                throw new IllegalArgumentException("이미지를 파일로 업로드한 뒤 저장해 주세요");
            try {
                var uri = URI.create(source);
                String path = uri.normalize().getPath();
                if (path != null && path.contains(PREFIX))
                    throw new IllegalArgumentException("첨부 이미지 주소가 올바르지 않습니다");
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("이미지 주소가 올바르지 않습니다");
            }
        }
        return ids;
    }
}
