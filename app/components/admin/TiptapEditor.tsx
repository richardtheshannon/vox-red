'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Button from '../ui/Button'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // Disable the built-in link extension
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
      <div className="border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet List
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Ordered List
        </Button>
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addLink}
        >
          Link
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addImage}
        >
          Image
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
      />
    </div>
  )
}