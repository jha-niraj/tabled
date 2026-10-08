"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { useEffect } from "react"
import { cn } from "@repo/ui/lib/utils"
import {
    Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Link as LinkIcon,
    Undo, Redo,
} from "lucide-react"

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
    minHeight?: string
    maxHeight?: string
}

function ToolbarButton({ onClick, active, title, disabled, children }: {
    onClick: (e: React.MouseEvent) => void
    active?: boolean
    title?: string
    disabled?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onMouseDown={(e) => { e.preventDefault(); onClick(e) }}
            className={cn(
                "p-1.5 rounded transition-colors cursor-pointer",
                active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white",
                disabled && "opacity-40 cursor-not-allowed",
            )}
        >
            {children}
        </button>
    )
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Start writing...",
    className,
    minHeight = "200px",
    maxHeight,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                bulletList: {},
                orderedList: {},
                blockquote: {},
                horizontalRule: {},
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: "text-primary underline underline-offset-2" },
            }),
        ],
        content: value || "",
        editorProps: {
            attributes: {
                class: "rich-editor-content focus:outline-none min-w-full",
                style: `min-height: ${minHeight}; padding: 16px;`,
                "data-placeholder": placeholder,
            },
        },
        onUpdate({ editor }) {
            const html = editor.getHTML()
            onChange(html === "<p></p>" ? "" : html)
        },
    })

    useEffect(() => {
        if (!editor) return
        const current = editor.getHTML()
        const incoming = value || ""
        if (current !== incoming) {
            editor.commands.setContent(incoming, { emitUpdate: false })
        }
    }, [editor, value])

    if (!editor) return null

    const setLink = () => {
        const prev = editor.getAttributes("link").href as string | undefined
        const url = window.prompt("URL", prev)
        if (url === null) return
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
        }
    }

    return (
        <div className={cn("border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon size={14} /></ToolbarButton>

                <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1.5" />

                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolbarButton>

                <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1.5" />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"><Quote size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={14} /></ToolbarButton>

                <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1.5" />

                <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Insert link"><LinkIcon size={14} /></ToolbarButton>

                <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1.5" />

                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={14} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={14} /></ToolbarButton>
            </div>

            {/* Editor area */}
            <div
                className="bg-white dark:bg-neutral-900 focus-within:ring-1 focus-within:ring-neutral-400 dark:focus-within:ring-neutral-600 transition-all"
                style={maxHeight ? { maxHeight, overflow: "auto" } : undefined}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
