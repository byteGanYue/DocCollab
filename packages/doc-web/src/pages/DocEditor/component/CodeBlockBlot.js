import Quill from 'quill';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 可选其他主题

const BlockEmbed = Quill.import('blots/block/embed');

class CodeBlockBlot extends BlockEmbed {
  static create(value = { code: '', language: 'plaintext' }) {
    const node = super.create();
    node.setAttribute('data-language', value.language || 'plaintext');
    node.className = 'ql-custom-code-block';
    node.innerHTML = `
      <div class="code-block-header">
        <select class="code-lang-select">
          <option value="plaintext">Plain Text</option>
          <option value="javascript">JavaScript</option>
          <option value="json">JSON</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
        <button class="code-copy-btn">复制</button>
      </div>
      <pre><code contenteditable="true">${value.code || ''}</code></pre>
    `;
    // 设置语言
    node.querySelector('.code-lang-select').value =
      value.language || 'plaintext';
    // 复制按钮
    node.querySelector('.code-copy-btn').onclick = () => {
      navigator.clipboard.writeText(node.querySelector('code').innerText);
    };
    // 语言切换
    node.querySelector('.code-lang-select').onchange = e => {
      node.setAttribute('data-language', e.target.value);
      CodeBlockBlot.highlight(node);
    };
    // 代码编辑
    const codeEl = node.querySelector('code');
    codeEl.oninput = () => {
      CodeBlockBlot.highlight(node);
    };
    // 高亮
    setTimeout(() => CodeBlockBlot.highlight(node), 0);
    return node;
  }

  static value(node) {
    return {
      language: node.getAttribute('data-language') || 'plaintext',
      code: node.querySelector('code')?.innerText || '',
    };
  }

  static formats(node) {
    return node.getAttribute('data-language') || 'plaintext';
  }

  format(name, value) {
    if (name === 'code-block-language' && value) {
      this.domNode.setAttribute('data-language', value);
      CodeBlockBlot.highlight(this.domNode);
    } else {
      super.format(name, value);
    }
  }

  static highlight(node) {
    const code = node.querySelector('code');
    const lang = node.getAttribute('data-language');
    if (code && hljs.getLanguage(lang)) {
      code.className = lang;
      code.innerHTML = hljs.highlight(code.innerText, { language: lang }).value;
    } else if (code) {
      code.className = '';
      code.innerHTML = hljs.highlightAuto(code.innerText).value;
    }
  }
}
CodeBlockBlot.blotName = 'custom-code-block';
CodeBlockBlot.tagName = 'div';
CodeBlockBlot.className = 'ql-custom-code-block';
Quill.register(CodeBlockBlot);
export default CodeBlockBlot;
