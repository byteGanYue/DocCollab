import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import './unUseTool/editorTool/CodeBlockBlot.js';
import 'quill/dist/quill.core.css';
import styles from './editor.module.less';

const Editor = () => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!quillRef.current) {
      const quill = new Quill('#editor', {
        theme: 'snow',
        modules: {},
        placeholder: '开始编写您的文档...',
      });
      quillRef.current = quill;

      // 监听文本变化事件，设置isEdit标记
      quill.on('text-change', () => {
        // 当编辑器内容发生变化时，设置isEdit为true
        localStorage.setItem('isEdit', 'true');
      });
    }
  }, []);

  return (
    <div className={styles.editorContainer}>
      <div id="editor" ref={editorRef} className={styles.quillEditor} />
    </div>
  );
};

export default Editor;
