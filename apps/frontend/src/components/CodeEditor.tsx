import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import type { Language } from "../lib/api";

const LANGUAGE_EXTENSIONS = {
  js: javascript(),
  py: python(),
  java: java(),
  cpp: cpp(),
};

type CodeEditorProps = {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function CodeEditor({ language, value, onChange, readOnly }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={vscodeDark}
      extensions={[LANGUAGE_EXTENSIONS[language]]}
      readOnly={readOnly}
      height="100%"
      className="h-full overflow-auto text-sm"
      basicSetup={{ foldGutter: true, autocompletion: true }}
    />
  );
}
