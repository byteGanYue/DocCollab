import { Editor, withLogger, withHistory } from 'doc-editor';
import { useState } from 'react';

function EditorDemo() {
  const [value, setValue] = useState([
    { type: 'paragraph', children: [{ text: 'Hello Slate!' }] },
  ]);
  return (
    <Editor
      value={value}
      onChange={setValue}
      plugins={[withLogger, withHistory]}
    />
  );
}

export default EditorDemo;
