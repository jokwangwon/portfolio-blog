import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutType = "info" | "warning" | "success" | "error";

const CALLOUT_ICONS: Record<CalloutType, string> = {
  info: "💡",
  warning: "⚠️",
  success: "✅",
  error: "🚫",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info" as CalloutType,
        parseHTML: (el) => el.getAttribute("data-callout-type") || "info",
        renderHTML: (attrs) => ({ "data-callout-type": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-callout": "" }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { type: attrs?.type ?? "info" },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const type = (node.attrs.type as CalloutType) || "info";

      const dom = document.createElement("div");
      dom.classList.add("callout-block", `callout-${type}`);

      // Icon button — cycles through callout types on click
      const iconBtn = document.createElement("button");
      iconBtn.type = "button";
      iconBtn.classList.add("callout-icon");
      iconBtn.contentEditable = "false";
      iconBtn.textContent = CALLOUT_ICONS[type];

      const types: CalloutType[] = ["info", "warning", "success", "error"];
      iconBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const current = dom.dataset.calloutType as CalloutType;
        const idx = types.indexOf(current);
        const next = types[(idx + 1) % types.length];
        dom.dataset.calloutType = next;
        dom.className = `callout-block callout-${next}`;
        iconBtn.textContent = CALLOUT_ICONS[next];
      });

      dom.appendChild(iconBtn);
      dom.dataset.calloutType = type;

      const contentDOM = document.createElement("div");
      contentDOM.classList.add("callout-content");
      dom.appendChild(contentDOM);

      return { dom, contentDOM };
    };
  },
});
