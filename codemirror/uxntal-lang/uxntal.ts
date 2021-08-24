import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { Tag, styleTags } from "@codemirror/highlight";
import { parser } from "./uxntal.syntax.grammar";

export const UxnTags = {
  OpCode: Tag.define(),
  Macro: Tag.define(),

  Label: Tag.define(),
  Sublabel: Tag.define(),

  Comment: Tag.define(),
  Hexadecimal: Tag.define(),

  RawWord: Tag.define(),
  RawAddress: Tag.define(),
  RawCharacter: Tag.define(),

  LiteralAddressZeroPage: Tag.define(),
  LiteralAddressAbsolute: Tag.define(),
  LiteralAddressRelative: Tag.define(),

  PadAbsolute: Tag.define(),
  PadRelative: Tag.define(),
};

export const UxntalLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [styleTags(UxnTags)],
  }),
  languageData: {
    name: "uxntal",
    extensions: ["tal"],
  },
});

export function UXNTAL() {
  return new LanguageSupport(UxntalLanguage);
}
