import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  variables?: string[];
  onInsertVariable?: (variable: string) => void;
}

export function RichTextEditor({ content, onChange, variables, onInsertVariable }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b p-2 flex items-center gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <FontAwesomeIcon icon="bold" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <FontAwesomeIcon icon="italic" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <FontAwesomeIcon icon="heading" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <FontAwesomeIcon icon="list-ul" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <FontAwesomeIcon icon="list-ol" />
        </Button>
        
        {variables && variables.length > 0 && (
          <div className="border-l ml-2 pl-2">
            <select
              className="text-sm border rounded px-2 py-1"
              onChange={(e) => {
                if (e.target.value) {
                  editor.chain().focus().insertContent(`{${e.target.value}}`).run();
                  onInsertVariable?.(e.target.value);
                }
                e.target.value = '';
              }}
            >
              <option value="">Insert Variable...</option>
              {variables.map((variable) => (
                <option key={variable} value={variable}>{variable}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  );
}
