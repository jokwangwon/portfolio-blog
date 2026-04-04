import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (attrs: { src: string }) => ReturnType;
    };
  }
}

function toEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/) ??
    url.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // CodePen
  const cpMatch = url.match(/codepen\.io\/([\w-]+)\/pen\/([\w-]+)/);
  if (cpMatch) return `https://codepen.io/${cpMatch[1]}/embed/${cpMatch[2]}?default-tab=result`;

  // Already an embed/iframe URL
  if (url.includes("/embed") || url.includes("iframe")) return url;

  return null;
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      originalUrl: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-embed": "" })];
  },

  addCommands() {
    return {
      setEmbed:
        ({ src }) =>
        ({ commands }) => {
          const embedUrl = toEmbedUrl(src);
          if (!embedUrl) return false;
          return commands.insertContent({
            type: this.name,
            attrs: { src: embedUrl, originalUrl: src },
          });
        },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.classList.add("embed-block");

      const src = node.attrs.src as string;
      if (src) {
        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "true");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        );
        iframe.classList.add("embed-iframe");
        dom.appendChild(iframe);
      }

      return { dom };
    };
  },
});
