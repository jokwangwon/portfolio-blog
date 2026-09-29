import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import ProtectedImage from "../../ProtectedImage";

function ImageView({ node, selected }: NodeViewProps) {
  return <NodeViewWrapper className={selected ? "outline outline-2 outline-primary" : ""}>
    <ProtectedImage src={node.attrs.src} alt={node.attrs.alt || ""} className="max-w-full h-auto rounded-lg" />
  </NodeViewWrapper>;
}
export const AttachmentImage = Image.extend({
  addNodeView() { return ReactNodeViewRenderer(ImageView); },
}).configure({ allowBase64: true });
