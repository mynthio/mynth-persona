import type { MDXComponents } from "mdx/types";

// Define global MDX components (custom elements can be added later)
const components: MDXComponents = {
  // Example: customize heading rendering
  // h2: (props) => <h2 style={{ marginTop: 24 }} {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}