import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface RemoteTextCursor {
  userId: string;
  name: string;
  color: string;
  from: number;
  to: number;
}

export const remoteCursorsPluginKey = new PluginKey("remoteCursors");

function buildDecorations(
  cursors: RemoteTextCursor[],
  doc: { content: { size: number } }
): DecorationSet {
  if (!cursors.length) return DecorationSet.empty;

  const decorations: Decoration[] = [];
  const docSize = doc.content.size;

  cursors.forEach((cursor) => {
    const from = Math.max(0, Math.min(cursor.from, docSize));
    const to = Math.max(0, Math.min(cursor.to, docSize));

    // Caret widget at cursor position
    const caretWidget = document.createElement("span");
    caretWidget.className = "remote-text-cursor";
    caretWidget.style.borderLeft = `2px solid ${cursor.color}`;
    caretWidget.setAttribute("data-user", cursor.name);

    const label = document.createElement("span");
    label.className = "remote-text-cursor-label";
    label.textContent = cursor.name;
    label.style.backgroundColor = cursor.color;
    caretWidget.appendChild(label);

    decorations.push(Decoration.widget(from, caretWidget, { side: 1 }));

    // Selection highlight if range selected
    if (from !== to) {
      decorations.push(
        Decoration.inline(from, to, {
          class: "remote-text-selection",
          style: `background-color: ${cursor.color}30;`,
        })
      );
    }
  });

  return DecorationSet.create(doc as Parameters<typeof DecorationSet.create>[0], decorations);
}

export const RemoteCursors = Extension.create({
  name: "remoteCursors",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: remoteCursorsPluginKey,
        state: {
          init() {
            return {
              cursors: [] as RemoteTextCursor[],
              decorations: DecorationSet.empty,
            };
          },
          apply(tr, value, _oldState, newState) {
            const meta = tr.getMeta(remoteCursorsPluginKey) as
              | RemoteTextCursor[]
              | undefined;
            if (meta !== undefined) {
              return {
                cursors: meta,
                decorations: buildDecorations(meta, newState.doc),
              };
            }
            if (tr.docChanged) {
              return {
                cursors: value.cursors,
                decorations: buildDecorations(value.cursors, newState.doc),
              };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            return (
              remoteCursorsPluginKey.getState(state)?.decorations ||
              DecorationSet.empty
            );
          },
        },
      }),
    ];
  },
});
