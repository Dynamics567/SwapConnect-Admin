import { Node, mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImage: (attrs: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
    calloutBox: {
      setCallout: (variant?: CalloutVariant) => ReturnType;
      unsetCallout: () => ReturnType;
    };
    embedBlock: {
      setEmbed: (src: string) => ReturnType;
    };
    ctaButtonBlock: {
      setCtaButton: (attrs: { label: string; href: string }) => ReturnType;
    };
  }
}

// Extends the stock image node with an optional caption, rendered as a real
// <figure>/<figcaption> pair -- this is what the public blog page's [&_img]
// styling and content renderer expect, and it's plain HTML so no special
// rendering support is needed on the public site.
export const ImageWithCaption = Node.create({
  name: "image",
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      caption: { default: null },
    };
  },

  parseHTML() {
    return [
      { tag: "figure[data-type='image-figure']" },
      { tag: "img[src]" },
    ];
  },

  renderHTML({ HTMLAttributes }): DOMOutputSpec {
    const { src, alt, caption, ...rest } = HTMLAttributes;
    const img: DOMOutputSpec = ["img", mergeAttributes(rest, { src, alt })];
    if (!caption) return img;
    return [
      "figure",
      { "data-type": "image-figure" },
      img as unknown as DOMOutputSpec,
      ["figcaption", {}, caption],
    ];
  },

  addCommands() {
    return {
      setImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

const CALLOUT_VARIANTS = ["info", "warning", "success"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

// A colored, bordered box for tips/warnings/callouts -- a real block node
// (not just a styled blockquote) so its variant survives as structured data.
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: { default: "info" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='callout']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        "data-variant": HTMLAttributes.variant,
        class: `callout callout-${HTMLAttributes.variant}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (variant = "info") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});

// A responsive iframe embed (YouTube/Vimeo). Atom node -- the embed URL is
// set once via the toolbar's popover, not edited inline.
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: "div[data-type='embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-type": "embed", class: "embed-wrapper" },
      ["iframe", mergeAttributes(HTMLAttributes, { frameborder: "0", allowfullscreen: "true" })],
    ];
  },

  addCommands() {
    return {
      setEmbed:
        (src) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src } }),
    };
  },
});

// A styled call-to-action link. label/href are attributes (not editable
// inline text) -- edited by reopening the toolbar popover, which keeps this
// node simple and robust rather than a contentEditable-inside-node NodeView.
export const CtaButton = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: { default: "Learn more" },
      href: { default: "#" },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-type='cta-button']" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { label, href, ...rest } = HTMLAttributes;
    return [
      "a",
      mergeAttributes(rest, {
        href,
        "data-type": "cta-button",
        class: "cta-button",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      label,
    ];
  },

  addCommands() {
    return {
      setCtaButton:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
