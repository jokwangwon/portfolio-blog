package com.portfolio.module.blog.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class AttachmentReferencesTest {
    private static final UUID FIRST = UUID.fromString("aaaaaaaa-1111-2222-3333-444444444444");
    private static final UUID SECOND = UUID.fromString("bbbbbbbb-1111-2222-3333-444444444444");
    private static final String URL = "/api/portal/attachments/" + FIRST;
    private final AttachmentReferences references = new AttachmentReferences();

    @Test
    void extractsInlineReferenceShortcutAndHtmlImagesWithoutDuplicates() {
        String content = "![inline](" + URL + ")\n\n"
                + "![reference][diagram]\n\n![diagram]\n\n"
                + "[diagram]: /api/portal/attachments/" + SECOND + "\n\n"
                + "<p><img alt='same image' src='" + URL + "'></p>";
        assertEquals(Set.of(FIRST, SECOND), references.extract(content));
    }

    @Test
    void ignoresCodeFencesInlineCodeLinksAndUnusedReferences() {
        String content = "`![example](" + URL + ")`\n\n"
                + "```html\n<img src='" + URL + "'>\n```\n\n"
                + "    ![indented code](" + URL + ")\n\n"
                + "[download](" + URL + ")\n\n"
                + "[unused]: " + URL + "\n";
        assertTrue(references.extract(content).isEmpty());
    }

    @Test
    void acceptsOrdinaryExternalImagesWithoutBindingThem() {
        assertTrue(references.extract("![external](https://images.example.com/study.png)").isEmpty());
    }

    @Test
    void rejectsNonCanonicalAttachmentImageAddresses() {
        for (String source : List.of(
                URL + "?download=1", URL + "#preview", URL + "/",
                "https://gwangwon.dev" + URL, "//gwangwon.dev" + URL,
                "/api%2Fportal%2Fattachments%2F" + FIRST,
                "/api/portal/attachments/../attachments/" + FIRST,
                "/api/portal/attachments/" + FIRST.toString().toUpperCase())) {
            assertThrows(IllegalArgumentException.class,
                    () -> references.extract("![image](" + source + ")"), source);
        }
    }

    @Test
    void decodesHtmlEntitiesBeforeCheckingCanonicalAddress() {
        assertThrows(IllegalArgumentException.class,
                () -> references.extract("<img src='" + URL + "&#x3f;download=1'>"));
    }

    @Test
    void rejectsDataAndBlobImagesButPreservesTheirCodeExamples() {
        for (String source : List.of("data:image/png;base64,aGVsbG8=", "blob:https://gwangwon.dev/example")) {
            assertThrows(IllegalArgumentException.class,
                    () -> references.extract("![image](" + source + ")"), source);
            assertThrows(IllegalArgumentException.class,
                    () -> references.extract("<img src='" + source + "'>"), source);
            assertTrue(references.extract("`![example](" + source + ")`\n\n"
                    + "```html\n<img src='" + source + "'>\n```").isEmpty(), source);
        }
    }
}
