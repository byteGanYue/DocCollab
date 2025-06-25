import React, { useMemo } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor } from 'slate';

const Editor = ({ value, onChange, plugins = [], ...props }) => {
  // 创建基础 editor
  const editor = useMemo(() => {
    let ed = withReact(createEditor());
    // 应用插件
    plugins.forEach(plugin => {
      ed = plugin(ed);
    });
    return ed;
  }, [plugins]);

  return (
    <Slate editor={editor} value={value} onChange={onChange}>
      <Editable {...props} />
    </Slate>
  );
};

export default Editor;
