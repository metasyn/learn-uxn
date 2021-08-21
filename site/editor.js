import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';

// eslint-disable-next-line
window.editor = new EditorView({
  state: EditorState.create({
    extensions: [basicSetup],
  }),
  parent: document.getElementById('editor'),
});
