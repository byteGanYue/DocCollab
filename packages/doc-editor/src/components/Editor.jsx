import React, { useMemo } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor } from 'slate';

const Editor = ({
  value,
  onChange,
  plugins = [],
  renderElement,
  renderLeaf,
  placeholder,
  ...editableProps
}) => {
  const editor = useMemo(() => {
    let ed = withReact(createEditor());
    plugins.forEach(plugin => {
      ed = plugin(ed);
    });
    return ed;
  }, [plugins]);

  // Debug
  console.log(
    'Editor value:',
    value,
    'placeholder:',
    placeholder,
    'editableProps:',
    editableProps,
  );

  return (
    <Slate editor={editor} value={value} onChange={onChange}>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder={placeholder}
        {...editableProps}
      />
    </Slate>
  );
};

export default Editor;
