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
    }
  }, []);

  return (
    <div className={styles.editorContainer}>
      <div id="editor" ref={editorRef} className={styles.quillEditor} />
    </div>
  );
};

export default Editor;
