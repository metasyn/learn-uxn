import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { Tag, tags, defaultHighlightStyle, classHighlightStyle, HighlightStyle } from "@codemirror/highlight";
import { UXNTAL, UxnTags }  from './uxntal-lang/uxntal.ts';


const tagsToClass = Object.keys(UxnTags).map((item) => {
  return { tag: UxnTags[item], class: `highlight-${item.toLowerCase()}`, color: 'pink'}
});

const style = HighlightStyle.define(tagsToClass);

// eslint-disable-next-line
window.editor = new EditorView({
  state: EditorState.create({
    extensions: [
      basicSetup,
      UXNTAL(),
      classHighlightStyle,
      style,
    ],
  }),
  parent: document.getElementById('editor'),
});
