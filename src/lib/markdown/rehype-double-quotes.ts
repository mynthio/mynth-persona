import type { Plugin } from "unified";
import type { Root, Text, Element } from "hast";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin that wraps double-quoted substrings in a span with a class
 * so they can be styled distinctly in rendered markdown.
 *
 * Example: She said "hello world" ->
 * She said <span class="md-doublequoted">"hello world"</span>
 */
export const rehypeDoubleQuotes: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (parent == null || index == null) return;

      // Skip inside code/pre/script/style/anchor elements
      if (
        parent.type === "element" &&
        ["code", "pre", "script", "style", "a"].includes(parent.tagName)
      ) {
        return;
      }

      const value = node.value;
      if (!value || typeof value !== "string") return;

      // Match balanced double quotes without newlines, multiple occurrences per node
      const regex = /"([^"\n]+)"/g;
      let match: RegExpExecArray | null;
      const newNodes: (Text | Element)[] = [];
      let last = 0;

      while ((match = regex.exec(value))) {
        const start = match.index;
        const end = regex.lastIndex;

        // Text before the quote
        if (start > last) {
          newNodes.push({ type: "text", value: value.slice(last, start) });
        }

        const quoted = match[0]; // includes the quotes

        // Wrap the full quoted segment including the quotes
        newNodes.push({
          type: "element",
          tagName: "span",
          properties: { className: ["md-doublequoted"] },
          children: [{ type: "text", value: quoted }],
        });

        last = end;
      }

      if (newNodes.length) {
        // Remaining text after the last quote
        if (last < value.length) {
          newNodes.push({ type: "text", value: value.slice(last) });
        }

        parent.children.splice(index, 1, ...newNodes);
        // Inform visitor to continue after inserted nodes
        return index + newNodes.length;
      }
    });
  };
};

export default rehypeDoubleQuotes;
