/**
 * Turns `$…$` and `$$…$$` maths in MDX (parsed by remark-math) into the app's own <Tex> component,
 * so lessons are typeset by the same bundled KaTeX as everything else.
 */
interface MdNode {
  type: string;
  value?: string | null;
  children?: MdNode[];
  [key: string]: unknown;
}

function texElement(node: MdNode): MdNode {
  const display = node.type === 'math';
  const attributes: MdNode[] = [{ type: 'mdxJsxAttribute', name: 'tex', value: node.value ?? '' }];
  if (display) attributes.push({ type: 'mdxJsxAttribute', name: 'display', value: null });
  return {
    type: display ? 'mdxJsxFlowElement' : 'mdxJsxTextElement',
    name: 'Tex',
    attributes,
    children: [],
  };
}

function walk(node: MdNode) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'inlineMath' || child.type === 'math') return texElement(child);
    walk(child);
    return child;
  });
}

export default function remarkTex() {
  return (tree: MdNode) => {
    walk(tree);
  };
}
