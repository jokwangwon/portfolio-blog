import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (attrs?: { content?: string }) => ReturnType;
    };
  }
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      content: { default: "E = mc^2" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-math-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-math-block": "" })];
  },

  addCommands() {
    return {
      setMathBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { content: attrs?.content ?? "E = mc^2" },
          });
        },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.classList.add("math-block");

      let isEditing = false;
      let latex = (node.attrs.content as string) || "E = mc^2";

      const preview = document.createElement("div");
      preview.classList.add("math-preview");
      preview.contentEditable = "false";

      const input = document.createElement("textarea");
      input.classList.add("math-input");
      input.value = latex;
      input.rows = 2;
      input.style.display = "none";
      input.contentEditable = "false";

      function renderMath() {
        try {
          preview.innerHTML = katex.renderToString(latex, {
            displayMode: true,
            throwOnError: false,
          });
        } catch {
          preview.textContent = latex;
        }
      }

      renderMath();

      // Click to edit
      preview.addEventListener("dblclick", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isEditing = true;
        preview.style.display = "none";
        input.style.display = "";
        input.value = latex;
        input.focus();
      });

      // Save on blur or Enter
      function save() {
        if (!isEditing) return;
        isEditing = false;
        latex = input.value;
        input.style.display = "none";
        preview.style.display = "";
        renderMath();

        // Persist to ProseMirror
        const pos = getPos();
        if (typeof pos === "number") {
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              content: latex,
            }),
          );
        }
      }

      input.addEventListener("blur", save);
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          save();
        }
        if (e.key === "Escape") {
          isEditing = false;
          input.style.display = "none";
          preview.style.display = "";
        }
      });

      dom.appendChild(preview);
      dom.appendChild(input);

      return { dom };
    };
  },
});
