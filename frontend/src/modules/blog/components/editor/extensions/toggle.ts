import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    details: {
      setDetails: () => ReturnType;
    };
  }
}

export const Details = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary detailsContent",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes, { open: "" }), 0];
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "detailsSummary",
                content: [{ type: "text", text: "토글 제목" }],
              },
              {
                type: "detailsContent",
                content: [{ type: "paragraph" }],
              },
            ],
          });
        },
    };
  },

  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      dom.classList.add("toggle-block");
      dom.dataset.open = "true";

      const contentDOM = document.createElement("div");
      dom.appendChild(contentDOM);

      // Event delegation: handle toggle arrow clicks from child DetailsSummary
      dom.addEventListener("mousedown", (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".toggle-arrow")) return;
        e.preventDefault();
        e.stopPropagation();

        const isOpen = dom.dataset.open !== "false";
        const newOpen = !isOpen;
        dom.dataset.open = String(newOpen);

        // Direct DOM manipulation — CSS selectors are unreliable in TailwindCSS v4
        const arrowSvg = dom.querySelector(".toggle-arrow svg") as SVGElement | null;
        if (arrowSvg) {
          arrowSvg.style.transform = newOpen ? "rotate(90deg)" : "";
        }
        const content = dom.querySelector(".toggle-content") as HTMLElement | null;
        if (content) {
          content.style.display = newOpen ? "" : "none";
        }
      });

      return { dom, contentDOM };
    };
  },
});

export const DetailsSummary = Node.create({
  name: "detailsSummary",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "summary" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      dom.classList.add("toggle-summary");

      const arrow = document.createElement("button");
      arrow.type = "button";
      arrow.classList.add("toggle-arrow");
      arrow.contentEditable = "false";
      arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="transform:rotate(90deg);transition:transform 0.15s ease"><path d="M6 3l5 5-5 5V3z"/></svg>`;

      dom.appendChild(arrow);

      const contentDOM = document.createElement("span");
      contentDOM.classList.add("toggle-summary-text");
      dom.appendChild(contentDOM);

      return { dom, contentDOM };
    };
  },
});

export const DetailsContent = Node.create({
  name: "detailsContent",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-details-content]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-details-content": "" }),
      0,
    ];
  },

  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      dom.classList.add("toggle-content");

      const contentDOM = document.createElement("div");
      dom.appendChild(contentDOM);

      return { dom, contentDOM };
    };
  },
});
