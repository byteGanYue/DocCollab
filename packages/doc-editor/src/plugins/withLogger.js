function withLogger(editor) {
  const { onChange } = editor;
  editor.onChange = () => {
    console.log('内容变更:', editor.children);
    if (onChange) onChange();
  };
  return editor;
}
export default withLogger;
