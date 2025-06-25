import { Editor, withLogger, withHistory } from 'doc-editor';
import { useState } from 'react';

function EditorDemo() {
  const [value, setValue] = useState([
    { type: 'paragraph', children: [{ text: 'Hello Slate!' }] },
  ]);

  console.log('当前 value:', value);
  console.log('Editor value:', value);

  // 假设你有如下自定义渲染函数
  const renderElement = props => <p {...props.attributes}>{props.children}</p>;
  const renderLeaf = props => (
    <span {...props.attributes}>{props.children}</span>
  );

  return (
    <Editor
      value={value || [{ type: 'paragraph', children: [{ text: '' }] }]}
      onChange={v => {
        if (!Array.isArray(v)) {
          console.error('onChange 传入了非法 value:', v);
          return;
        }
        setValue(v);
      }}
      plugins={[withLogger, withHistory]}
      placeholder="请输入内容"
      renderElement={renderElement}
      renderLeaf={renderLeaf}
    />
  );
}

export default EditorDemo;
