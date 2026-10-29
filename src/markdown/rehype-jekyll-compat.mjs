import { visit, SKIP } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';

// Keeps the HTML shape the Jekyll (kramdown + Rouge) build produced, so the
// existing CSS and in-page anchors keep working.
export default function rehypeJekyllCompat() {
  return (tree) => {
    const usedIds = new Map();

    visit(tree, 'element', (node, index, parent) => {
      // ```mermaid -> <div class="mermaid"> rendered client-side
      if (node.tagName === 'pre' && isLanguage(node.children[0], 'mermaid')) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['mermaid'] },
          children: [{ type: 'text', value: toString(node) }],
        };
        return SKIP;
      }

      // Shiki block -> <div class="language-x highlighter-rouge"><div class="highlight"><pre class="highlight"><code>
      if (node.tagName === 'pre' && classes(node).includes('astro-code')) {
        const lang = node.properties.dataLanguage || node.properties['data-language'] || 'plaintext';
        const pre = {
          type: 'element',
          tagName: 'pre',
          properties: { className: ['highlight'] },
          children: node.children,
        };
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: [`language-${lang}`, 'highlighter-rouge'] },
          children: [{ type: 'element', tagName: 'div', properties: { className: ['highlight'] }, children: [pre] }],
        };
        return SKIP;
      }

      // Inline code
      if (node.tagName === 'code' && parent.tagName !== 'pre') {
        node.properties.className = ['language-plaintext', 'highlighter-rouge'];
        return;
      }

      // kramdown GFM header ids
      if (/^h[1-6]$/.test(node.tagName) && !node.properties.id) {
        let id = toString(node).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- \t]/gu, '').replace(/[ \t]/g, '-');
        const count = usedIds.has(id) ? usedIds.get(id) + 1 : 0;
        usedIds.set(id, count);
        if (count > 0) id += `-${count}`;
        node.properties.id = id;
      }
    });
  };
}

// Shiki sets `class` as a string, hast from markdown uses a `className` array.
function classes(node) {
  const { className = [], class: cls = '' } = node?.properties ?? {};
  return [].concat(className, String(cls).split(' ').filter(Boolean));
}

function isLanguage(node, lang) {
  return node?.tagName === 'code' && classes(node).includes(`language-${lang}`);
}
