import { FormattedUserRow } from "./types";
import UserRoleBadge from "./UserRoleBadge";
import ProfileCompletionIndicator from "./ProfileCompletionIndicator";
import UserActionMenu from "./UserActionMenu";

interface UserCardProps {
  user: FormattedUserRow;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onCardClick: () => void;
  onView: () => void;
  onRequestSuspend: () => void;
  onRequestBan: () => void;
  onRequestBadgeToggle: () => void;
  onRequestMessage: () => void;
  onRequestUpgrade?: () => void;
}

export default function UserCard({
  user,
  menuOpen,
  onMenuOpenChange,
  onCardClick,
  onView,
  onRequestSuspend,
  onRequestBan,
  onRequestBadgeToggle,
  onRequestMessage,
  onRequestUpgrade,
}: UserCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 min-w-0"
      onClick={onCardClick}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="font-semibold text-[#353535] break-words">{user.name}</p>
          <p className="text-sm text-[#505050] break-words">{user.email}</p>
          <p className="text-sm text-[#848484] break-words">{user.phone_number}</p>
        </div>
        <span className="text-xs text-[#BEBEBE] whitespace-nowrap shrink-0">
          {user.dateJoinedLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <UserRoleBadge accountType={user.accountType} />
        <span className="font-semibold text-brand-emerald text-sm">
          {user.amountSpentLabel}
        </span>
      </div>

      <ProfileCompletionIndicator profileCompletion={user.profileCompletion} density="comfortable" />

      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          className="flex-1 min-h-[44px] bg-brand-emerald text-white rounded-lg text-sm font-medium hover:bg-brand-emerald-hover transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          View User
        </button>
        <div onClick={(e) => e.stopPropagation()}>
          <UserActionMenu
            user={user}
            open={menuOpen}
            onOpenChange={onMenuOpenChange}
            onView={onView}
            onRequestSuspend={onRequestSuspend}
            onRequestBan={onRequestBan}
            onRequestBadgeToggle={onRequestBadgeToggle}
            onRequestMessage={onRequestMessage}
            onRequestUpgrade={onRequestUpgrade}
          />
        </div>
      </div>
    </div>
  );
}
