"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Unlink,
  Quote,
  RemoveFormatting,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // preventDefault keeps the selection/caret inside the editor
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid size-8 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

/**
 * Lightweight WYSIWYG editor. Authors format text visually (bold, italic,
 * headings, lists, links…) and the component emits clean HTML — the same
 * storage format the public blog renders — so no server changes are needed.
 * Dependency-free (contenteditable + document.execCommand). A "HTML" toggle is
 * kept for power users / editing imported posts with complex markup.
 */
export function RichTextEditor({
  value,
  onChange,
  minHeight = 360,
}: {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<"rich" | "html">("rich");

  // Seed the editable area once (and whenever we switch back from HTML mode),
  // without re-writing innerHTML on every keystroke (which would drop the caret).
  React.useEffect(() => {
    if (mode === "rich" && ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    emit();
  }

  function addLink() {
    const url = window.prompt("Link URL (https://…)");
    if (url) exec("createLink", url);
  }

  return (
    <div className="overflow-hidden rounded-md border border-input">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1.5">
        {mode === "rich" ? (
          <>
            <ToolbarButton title="Heading" onClick={() => exec("formatBlock", "<h2>")}>
              <Heading2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Subheading" onClick={() => exec("formatBlock", "<h3>")}>
              <Heading3 className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Normal text" onClick={() => exec("formatBlock", "<p>")}>
              <span className="text-xs font-semibold">P</span>
            </ToolbarButton>
            <Divider />
            <ToolbarButton title="Bold" onClick={() => exec("bold")}>
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => exec("italic")}>
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Underline" onClick={() => exec("underline")}>
              <Underline className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Strikethrough" onClick={() => exec("strikeThrough")}>
              <Strikethrough className="size-4" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton title="Bulleted list" onClick={() => exec("insertUnorderedList")}>
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Quote" onClick={() => exec("formatBlock", "<blockquote>")}>
              <Quote className="size-4" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton title="Add link" onClick={addLink}>
              <Link2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Remove link" onClick={() => exec("unlink")}>
              <Unlink className="size-4" />
            </ToolbarButton>
            <ToolbarButton title="Clear formatting" onClick={() => exec("removeFormat")}>
              <RemoveFormatting className="size-4" />
            </ToolbarButton>
          </>
        ) : (
          <span className="px-1 text-xs font-medium text-muted-foreground">HTML source</span>
        )}

        <button
          type="button"
          onClick={() => setMode((m) => (m === "rich" ? "html" : "rich"))}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
            mode === "html"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Toggle HTML source"
        >
          <Code className="size-3.5" /> HTML
        </button>
      </div>

      {/* editor surface */}
      {mode === "rich" ? (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          // paste as plain text so pasted styles/junk don't leak in
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
          className="blog-content max-w-none overflow-y-auto bg-background px-4 py-3 outline-none"
          style={{ minHeight }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background px-4 py-3 font-mono text-sm outline-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
