import { useEffect, useRef } from "react";
import { MoreVertical } from "lucide-react";
import { FormattedUserRow } from "./types";

interface UserActionMenuProps {
  user: FormattedUserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onView: () => void;
  onRequestSuspend: () => void;
  onRequestBan: () => void;
  onRequestBadgeToggle: () => void;
  onRequestMessage: () => void;
  onRequestUpgrade?: () => void;
  align?: "left" | "right";
}

export default function UserActionMenu({
  user,
  open,
  onOpenChange,
  onView,
  onRequestSuspend,
  onRequestBan,
  onRequestBadgeToggle,
  onRequestMessage,
  onRequestUpgrade,
  align = "right",
}: UserActionMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  const itemClass =
    "block w-full text-left px-4 py-2.5 text-sm hover:bg-[#F7F8FB] transition-colors";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#F7F8FB] transition-colors"
        aria-label={`Actions for ${user.name}`}
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
          aria-label={`Actions for ${user.name}`}
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1 w-44 bg-white border rounded-lg shadow-lg z-20 py-1`}
          onClick={(e) => e.stopPropagation()}
        >
          <button role="menuitem" className={`${itemClass} text-brand-emerald`} onClick={onView}>
            View
          </button>
          <button role="menuitem" className={`${itemClass} text-[#434343]`} onClick={onRequestSuspend}>
            {user.isSuspended ? "Unsuspend" : "Suspend"}
          </button>
          <button role="menuitem" className={`${itemClass} text-[#434343]`} onClick={onRequestBadgeToggle}>
            {user.hasBadge ? "Remove Badge" : "Assign Badge"}
          </button>
          <button role="menuitem" className={`${itemClass} text-[#434343]`} onClick={onRequestMessage}>
            Message
          </button>
          {user.canUpgrade && onRequestUpgrade && (
            <button role="menuitem" className={`${itemClass} text-[#434343]`} onClick={onRequestUpgrade}>
              Upgrade to Store Owner
            </button>
          )}
          <div className="h-px bg-[#f0f0f0] my-1" />
          <button role="menuitem" className={`${itemClass} text-red-600 font-medium`} onClick={onRequestBan}>
            Ban
          </button>
        </div>
      )}
    </div>
  );
}
