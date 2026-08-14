"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, UnderlineIcon, Heading2, Heading3, List, ListOrdered, Quote,
  LinkIcon, ImageIcon, Table2, Code2, Minus, AlignLeft, AlignCenter, AlignRight,
  Youtube, MousePointerClick, Info, AlertTriangle, CheckCircle2, Undo2, Redo2,
} from "lucide-react";
import { ImageWithCaption, Callout, Embed, CtaButton, type CalloutVariant } from "./tiptapExtensions";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<{ url: string } | null>;
  placeholder?: string;
}

function ToolbarButton({
  onClick, active, title, children, disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "bg-[#037F44] text-white" : "text-[#505050] hover:bg-[#F7F8FB]"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-[#e5e7eb] mx-1" />;
}

function toYouTubeEmbed(url: string) {
  const watch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

export default function RichTextEditor({ content, onChange, onUploadImage, placeholder }: RichTextEditorProps) {
  const [embedPopoverOpen, setEmbedPopoverOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [ctaPopoverOpen, setCtaPopoverOpen] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      ImageWithCaption,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder || "Start writing your story…" }),
      Callout,
      Embed,
      CtaButton,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none min-h-[400px] focus:outline-none text-[#353535] [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#e6f9f0] [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#037F44] [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 [&_pre]:bg-[#1e1e1e] [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_.callout]:rounded-lg [&_.callout]:p-4 [&_.callout]:my-3 [&_.callout-info]:bg-blue-50 [&_.callout-info]:border [&_.callout-info]:border-blue-200 [&_.callout-warning]:bg-amber-50 [&_.callout-warning]:border [&_.callout-warning]:border-amber-200 [&_.callout-success]:bg-[#e6f9f0] [&_.callout-success]:border [&_.callout-success]:border-[#037F44]/20 [&_.embed-wrapper]:relative [&_.embed-wrapper]:pb-[56.25%] [&_.embed-wrapper]:h-0 [&_.embed-wrapper_iframe]:absolute [&_.embed-wrapper_iframe]:inset-0 [&_.embed-wrapper_iframe]:w-full [&_.embed-wrapper_iframe]:h-full [&_.embed-wrapper_iframe]:rounded-lg [&_.cta-button]:inline-block [&_.cta-button]:bg-[#037F44] [&_.cta-button]:text-white [&_.cta-button]:px-5 [&_.cta-button]:py-2.5 [&_.cta-button]:rounded-lg [&_.cta-button]:font-semibold [&_.cta-button]:no-underline [&_figure]:my-4 [&_figcaption]:text-xs [&_figcaption]:text-gray-400 [&_figcaption]:text-center [&_figcaption]:mt-2",
      },
    },
  });

  // Keep the editor in sync when `content` changes from outside (e.g. an AI
  // draft replaces the body) without fighting the user's own typing.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleImagePick = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const result = await onUploadImage(file);
      if (result?.url) {
        editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run();
      }
    } finally {
      setUploading(false);
    }
  }, [editor, onUploadImage]);

  if (!editor) return null;

  return (
    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap border-b border-[#e5e7eb] p-2 bg-[#FAFBFC] relative">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <Code2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRight size={15} />
        </ToolbarButton>
        <Divider />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => { setLinkUrl(editor.getAttributes("link").href || ""); setLinkPopoverOpen((v) => !v); }}
            active={editor.isActive("link")}
            title="Link"
          >
            <LinkIcon size={15} />
          </ToolbarButton>
          {linkPopoverOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-2 z-20 flex gap-2 w-64">
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 text-xs border border-[#e5e7eb] rounded px-2 py-1 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (linkUrl.trim()) editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
                  else editor.chain().focus().unsetLink().run();
                  setLinkPopoverOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (linkUrl.trim()) editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
                  else editor.chain().focus().unsetLink().run();
                  setLinkPopoverOpen(false);
                }}
                className="text-xs font-semibold text-[#037F44] px-2"
              >
                Set
              </button>
            </div>
          )}
        </div>

        {/* Image upload */}
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert image" disabled={uploading}>
          <ImageIcon size={15} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImagePick(file);
            e.target.value = "";
          }}
        />

        {/* Table */}
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
        >
          <Table2 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Callouts */}
        {([
          { variant: "info" as CalloutVariant, icon: Info, title: "Info callout" },
          { variant: "warning" as CalloutVariant, icon: AlertTriangle, title: "Warning callout" },
          { variant: "success" as CalloutVariant, icon: CheckCircle2, title: "Success callout" },
        ]).map(({ variant, icon: Icon, title }) => (
          <ToolbarButton key={variant} onClick={() => editor.chain().focus().setCallout(variant).run()} title={title}>
            <Icon size={15} />
          </ToolbarButton>
        ))}

        {/* Embed */}
        <div className="relative">
          <ToolbarButton onClick={() => setEmbedPopoverOpen((v) => !v)} title="Embed video">
            <Youtube size={15} />
          </ToolbarButton>
          {embedPopoverOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-2 z-20 flex gap-2 w-72">
              <input
                autoFocus
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="YouTube or Vimeo URL"
                className="flex-1 text-xs border border-[#e5e7eb] rounded px-2 py-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (embedUrl.trim()) editor.chain().focus().setEmbed(toYouTubeEmbed(embedUrl.trim())).run();
                  setEmbedUrl("");
                  setEmbedPopoverOpen(false);
                }}
                className="text-xs font-semibold text-[#037F44] px-2"
              >
                Insert
              </button>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="relative">
          <ToolbarButton onClick={() => setCtaPopoverOpen((v) => !v)} title="Insert button">
            <MousePointerClick size={15} />
          </ToolbarButton>
          {ctaPopoverOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-2 z-20 flex flex-col gap-2 w-64">
              <input
                autoFocus
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Button text"
                className="text-xs border border-[#e5e7eb] rounded px-2 py-1 focus:outline-none"
              />
              <input
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="https://…"
                className="text-xs border border-[#e5e7eb] rounded px-2 py-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (ctaLabel.trim() && ctaHref.trim()) {
                    editor.chain().focus().setCtaButton({ label: ctaLabel.trim(), href: ctaHref.trim() }).run();
                  }
                  setCtaLabel(""); setCtaHref("");
                  setCtaPopoverOpen(false);
                }}
                className="text-xs font-semibold text-[#037F44] self-end px-2"
              >
                Insert
              </button>
            </div>
          )}
        </div>

        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 size={15} />
        </ToolbarButton>

        {uploading && <span className="text-xs text-[#9ca3af] ml-2">Uploading image…</span>}
      </div>

      {/* Editor canvas */}
      <div className="px-5 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
