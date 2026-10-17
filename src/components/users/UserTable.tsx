import { FormattedUserRow } from "./types";
import UserTableRow from "./UserTableRow";

interface UserTableProps {
  users: FormattedUserRow[];
  openMenuId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onRowClick: (user: FormattedUserRow) => void;
  onView: (user: FormattedUserRow) => void;
  onRequestSuspend: (user: FormattedUserRow) => void;
  onRequestBan: (user: FormattedUserRow) => void;
  onRequestBadgeToggle: (user: FormattedUserRow) => void;
  onRequestMessage: (user: FormattedUserRow) => void;
  onRequestUpgrade: (user: FormattedUserRow) => void;
}

const HEADERS = [
  "NAME",
  "EMAIL",
  "PHONE NO",
  "CATEGORY",
  "PROFILE",
  "AMOUNT SPENT",
  "DATE JOINED",
  "ACTION",
];

export default function UserTable({
  users,
  openMenuId,
  onMenuOpenChange,
  onRowClick,
  onView,
  onRequestSuspend,
  onRequestBan,
  onRequestBadgeToggle,
  onRequestMessage,
  onRequestUpgrade,
}: UserTableProps) {
  return (
    <div className="hidden md:block bg-white rounded-lg shadow p-6 overflow-x-auto min-w-0">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-brand-emerald-light text-brand-emerald text-left">
            {HEADERS.map((header) => (
              <th key={header} className="py-3 px-4 text-[#505050] text-sm font-normal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              menuOpen={openMenuId === user.id}
              onMenuOpenChange={(open) => onMenuOpenChange(open ? user.id : null)}
              onRowClick={() => onRowClick(user)}
              onView={() => onView(user)}
              onRequestSuspend={() => onRequestSuspend(user)}
              onRequestBan={() => onRequestBan(user)}
              onRequestBadgeToggle={() => onRequestBadgeToggle(user)}
              onRequestMessage={() => onRequestMessage(user)}
              onRequestUpgrade={user.canUpgrade ? () => onRequestUpgrade(user) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
