import apiClient from "@/src/shell/api/client";

export interface AttachmentResponse {
  id: string;
  url: string;
  mediaType: string;
  byteSize: number;
  width: number;
  height: number;
}
export function attachmentPath(src: string): string | null {
  return /^\/api\/portal\/attachments\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(src)
    ? src.slice("/api/portal".length) : null;
}
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadImage(file: File): Promise<AttachmentResponse> {
  if (!["image/png", "image/jpeg"].includes(file.type)) throw new Error("PNG 또는 JPEG 이미지를 선택해 주세요.");
  if (file.size > MAX_BYTES) throw new Error("이미지는 10MB 이하로 선택해 주세요.");
  // Browser decoding applies JPEG EXIF orientation before pixels are re-encoded.
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode().catch(() => { throw new Error("이미지를 읽지 못했습니다. PNG 또는 JPEG 파일인지 확인해 주세요."); });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 8192 || image.naturalHeight > 8192 || image.naturalWidth * image.naturalHeight > 20_000_000) {
      throw new Error("이미지는 한 변 8,192px, 전체 2,000만 화소 이하여야 합니다.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지를 처리하지 못했습니다. 다른 브라우저에서 다시 시도해 주세요.");
    context.drawImage(image, 0, 0);
    const normalized = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("이미지를 처리하지 못했습니다.")), file.type, 0.95));
    if (normalized.size > MAX_BYTES) throw new Error("변환한 이미지가 10MB를 넘습니다. 이미지 크기를 줄여 주세요.");
    const form = new FormData();
    form.append("file", normalized, file.type === "image/png" ? "image.png" : "image.jpg");
    const { data } = await apiClient.post<AttachmentResponse>("/attachments", form, { headers: { "Content-Type": undefined } });
    if (!attachmentPath(data.url)) throw new Error("이미지 저장 응답이 올바르지 않습니다.");
    return data;
  } finally { URL.revokeObjectURL(source); }
}

// Protect fenced/indented code and inline code before inspecting image source syntax.
function codeRanges(content: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let offset = 0;
  let fence: { marker: string; length: number; start: number } | null = null;
  for (const line of content.split(/(?<=\n)/)) {
    const match = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (match && match[1][0] === fence.marker && match[1].length >= fence.length && !line.slice(match[0].length).trim()) {
        ranges.push([fence.start, offset + line.length]); fence = null;
      }
    } else if (match) fence = { marker: match[1][0], length: match[1].length, start: offset };
    else if (/^(?: {4}|\t)/.test(line)) ranges.push([offset, offset + line.length]);
    offset += line.length;
  }
  if (fence) ranges.push([fence.start, content.length]);
  const ticks = /`+/g;
  let match: RegExpExecArray | null;
  while ((match = ticks.exec(content))) {
    if (ranges.some(([start, end]) => match!.index >= start && match!.index < end)) continue;
    const end = content.indexOf(match[0], ticks.lastIndex);
    if (end >= 0) { ranges.push([match.index, end + match[0].length]); ticks.lastIndex = end + match[0].length; }
  }
  return ranges;
}

export async function convertInlineImages(content: string, upload: (file: File) => Promise<Pick<AttachmentResponse, "url">> = uploadImage): Promise<string> {
  const ranges = codeRanges(content);
  for (const comment of content.matchAll(/<!--[\s\S]*?(?:-->|$)/g)) ranges.push([comment.index, comment.index + comment[0].length]);
  const protectedAt = (index: number) => ranges.some(([start, end]) => index >= start && index < end) || (index > 0 && content[index - 1] === "\\" && (index < 2 || content[index - 2] !== "\\"));
  const matches: Array<{ start: number; end: number; source: string }> = [];
  const pattern = /!\[(?:\\.|[^\]\\])*\]\(\s*<?(data:image\/(?:png|jpe?g);base64,[a-z0-9+/=]+)>?(?:\s+["'][^"']*["'])?\s*\)|<img\b[^>]*?\bsrc\s*=\s*["'](data:image\/(?:png|jpe?g);base64,[a-z0-9+/=]+)["'][^>]*>/gi;
  for (const match of content.matchAll(pattern)) {
    if (protectedAt(match.index)) continue;
    const source = match[1] || match[2];
    const start = match.index + match[0].indexOf(source);
    matches.push({ start, end: start + source.length, source });
  }
  const normalizeLabel = (label: string) => label.replace(/\\([\[\]\\])/g, "$1").trim().replace(/\s+/g, " ").toLowerCase();
  const referenced = new Set<string>();
  for (const match of content.matchAll(/!\[((?:\\.|[^\]\\])*)\](?:[ \t]*\[((?:\\.|[^\]\\])*)\])?(?!\()/g)) {
    if (!protectedAt(match.index)) referenced.add(normalizeLabel(match[2] || match[1]));
  }
  const definitions = /^ {0,3}\[((?:\\.|[^\]\\])+)\]:[ \t]*<?(data:image\/(?:png|jpe?g);base64,[a-z0-9+/=]+)>?(?:[ \t]+["'][^"']*["'])?[ \t]*$/gim;
  const seenLabels = new Set<string>();
  for (const match of content.matchAll(definitions)) {
    const label = normalizeLabel(match[1]);
    if (protectedAt(match.index) || !referenced.has(label) || seenLabels.has(label)) continue;
    seenLabels.add(label);
    const start = match.index + match[0].indexOf(match[2]);
    matches.push({ start, end: start + match[2].length, source: match[2] });
  }
  matches.sort((a, b) => a.start - b.start);
  const uploaded = new Map<string, string>();
  for (const { source } of matches) {
    if (uploaded.has(source)) continue;
    const [prefix, base64] = source.split(",");
    if (base64.length > Math.ceil(MAX_BYTES / 3) * 4) throw new Error("이미지는 10MB 이하로 선택해 주세요.");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const type = prefix.toLowerCase().includes("png") ? "image/png" : "image/jpeg";
    const result = await upload(new File([bytes], type === "image/png" ? "image.png" : "image.jpg", { type }));
    uploaded.set(source, result.url);
  }
  let converted = content;
  for (const match of matches.reverse()) converted = converted.slice(0, match.start) + uploaded.get(match.source)! + converted.slice(match.end);
  return converted;
}
