import { FormattedUserRow } from "./types";
import UserRoleBadge from "./UserRoleBadge";
import ProfileCompletionIndicator from "./ProfileCompletionIndicator";
import UserActionMenu from "./UserActionMenu";

interface UserTableRowProps {
  user: FormattedUserRow;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onRowClick: () => void;
  onView: () => void;
  onRequestSuspend: () => void;
  onRequestBan: () => void;
  onRequestBadgeToggle: () => void;
  onRequestMessage: () => void;
  onRequestUpgrade?: () => void;
}

export default function UserTableRow({
  user,
  menuOpen,
  onMenuOpenChange,
  onRowClick,
  onView,
  onRequestSuspend,
  onRequestBan,
  onRequestBadgeToggle,
  onRequestMessage,
  onRequestUpgrade,
}: UserTableRowProps) {
  return (
    <tr
      className="border-b last:border-b-0 cursor-pointer hover:bg-[#F7F8FB] transition"
      onClick={onRowClick}
    >
      <td className="py-3 text-[#434343] text-sm px-4">{user.name}</td>
      <td className="py-3 text-[#434343] text-sm px-4">{user.email}</td>
      <td className="py-3 text-[#434343] text-sm px-4">{user.phone_number}</td>
      <td className="py-3 text-[#434343] text-sm px-4">
        <UserRoleBadge accountType={user.accountType} />
      </td>
      <td className="py-3 text-[#434343] text-sm px-4">
        <ProfileCompletionIndicator profileCompletion={user.profileCompletion} />
      </td>
      <td className="py-3 text-[#434343] text-sm px-4">{user.amountSpentLabel}</td>
      <td className="py-3 text-[#434343] text-sm px-4">{user.dateJoinedLabel}</td>
      <td className="py-3 text-[#434343] text-sm px-4" onClick={(e) => e.stopPropagation()}>
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
      </td>
    </tr>
  );
}
