import { useEffect, useRef } from "react";
import { MoreVertical } from "lucide-react";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "accent" | "danger";
  hidden?: boolean;
  divider?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
  align?: "left" | "right";
}

const VARIANT_CLASS: Record<NonNullable<ActionMenuItem["variant"]>, string> = {
  default: "text-[#434343]",
  accent: "text-brand-emerald",
  danger: "text-red-600 font-medium",
};

// Generic per-row overflow menu (3-dot trigger + dropdown), extracted from
// the User Management redesign after a dual-mount bug: a desktop table row
// and a mobile card for the same entity are both always mounted (one
// hidden via CSS depending on viewport), so if they share one lifted
// "which row's menu is open" id, both instances report open=true
// together, and each one's own outside-click listener treats a click
// inside the *visible* one as "outside" from the *hidden* one's
// perspective -- closing the menu and removing the button from the DOM
// before the click's own handler can run. The offsetParent check below
// (null when an ancestor has display:none) makes the hidden instance's
// listener a no-op, and each item closes the menu and fires its action
// in the same synchronous handler so both state updates land in one
// React batch regardless of listener order.
export default function ActionMenu({ items, open, onOpenChange, ariaLabel, align = "right" }: ActionMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (container.offsetParent === null) return;
      if (!container.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const itemClass = "block w-full text-left px-4 py-2.5 text-sm hover:bg-[#F7F8FB] transition-colors";
  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#F7F8FB] transition-colors"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
      >
        <MoreVertical size={20} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 w-48 bg-white border rounded-lg shadow-lg z-20 py-1`}
          onClick={(e) => e.stopPropagation()}
        >
          {visibleItems.map((item, idx) => (
            <div key={item.label}>
              {item.divider && idx > 0 && <div className="h-px bg-[#f0f0f0] my-1" />}
              <button
                role="menuitem"
                className={`${itemClass} ${VARIANT_CLASS[item.variant ?? "default"]}`}
                onClick={() => {
                  onOpenChange(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
