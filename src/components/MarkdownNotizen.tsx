import { useLayoutEffect, useRef, useState } from 'react';
import {
  BlockTypeSelect, BoldItalicUnderlineToggles, CodeToggle, CreateLink,
  DiffSourceToggleWrapper, ListsToggle, MDXEditor, UndoRedo,
  codeBlockPlugin, diffSourcePlugin, headingsPlugin, linkDialogPlugin,
  linkPlugin, listsPlugin, markdownShortcutPlugin, quotePlugin,
  thematicBreakPlugin, toolbarPlugin,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import './MarkdownNotizen.css';

interface MarkdownNotizenProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

const plugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  codeBlockPlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  diffSourcePlugin(),
  toolbarPlugin({ toolbarContents: () => (
    <DiffSourceToggleWrapper options={['rich-text', 'source']}>
      <UndoRedo />
      <BlockTypeSelect />
      <BoldItalicUnderlineToggles />
      <CodeToggle />
      <ListsToggle />
      <CreateLink />
    </DiffSourceToggleWrapper>
  ) }),
];

export default function MarkdownNotizen({ markdown, onChange }: MarkdownNotizenProps) {
  const [parseError, setParseError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [parseError, markdown]);

  if (parseError) {
    return (
      <>
        <p role="alert" className="mb-2 text-sm text-amber-800">Diese Notiz kann nicht als formatiertes Markdown angezeigt werden. Du kannst den Text hier weiter bearbeiten.</p>
        <textarea
          ref={textareaRef}
          aria-label="Notizen als Text bearbeiten"
          value={markdown}
          onChange={(event) => onChange(event.target.value)}
          rows={8}
          className="w-full resize-none overflow-hidden rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </>
    );
  }

  return (
    <MDXEditor
      markdown={markdown}
      onChange={(value, initialMarkdownNormalize) => { if (!initialMarkdownNormalize) onChange(value); }}
      onError={({ source }) => { if (source !== markdown) onChange(source); setParseError(true); }}
      placeholder="Ideen, Fragen und wichtige Angaben zum Haus"
      suppressHtmlProcessing
      plugins={plugins}
      className="notizen-editor"
      contentEditableClassName="notizen-inhalt"
    />
  );
}
