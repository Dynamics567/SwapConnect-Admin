import {
  LayoutDashboard,
  Settings,
  UserRound,
  UsersRound,
  Users,
  Package,
  Receipt,
  Building2,
  Activity,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  Tag,
  Sparkles,
  Store,
  Wallet,
  Megaphone,
  Landmark,
  Newspaper,
  FileText,
  FolderTree,
  Images,
  Timer,
  HeartHandshake,
  Gift,
  PackageCheck,
  Percent,
  PieChart,
  BookOpen,
  HandCoins,
  Banknote,
  Undo2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  url: string;
  icon: LucideIcon;
  roles: string[];
}

export interface NavEntry {
  label: string;
  icon: LucideIcon;
  url?: string; // standalone entries link directly and have no children
  children?: NavLeaf[];
}

// Dashboard and AI Studio are standalone -- every signed-in staff role sees
// them. Declared before navGroups since the "General" settings leaf below
// reuses it.
export const STANDALONE_ROLES = ["superadmin", "admin", "supportagent", "verificationofficer"];

// Single source of truth for every navigable admin page -- consumed by both
// the sidebar and the command palette, so they can never drift apart the way
// several duplicated data sources did elsewhere in this app before this
// session. See docs/NAVIGATION_ROADMAP.md for the full rationale.
export const navGroups: NavEntry[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    label: "Marketplace",
    icon: Store,
    children: [
      {
        label: "Listings",
        url: "/dashboard/items",
        icon: Package,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Physical Stores",
        url: "/dashboard/store",
        icon: Building2,
        roles: ["superadmin", "admin", "verificationofficer"],
      },
      {
        label: "Auctions",
        url: "/dashboard/auctions",
        icon: Timer,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Categories",
        url: "/dashboard/categories",
        icon: FolderTree,
        roles: ["superadmin", "admin"],
      },
    ],
  },
  {
    label: "Give & Circular",
    icon: HeartHandshake,
    children: [
      {
        label: "Donations",
        url: "/dashboard/give?tab=donations",
        icon: Gift,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Need Profiles",
        url: "/dashboard/give?tab=needs",
        icon: Users,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Allocations",
        url: "/dashboard/give?tab=allocations",
        icon: PackageCheck,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Impact",
        url: "/dashboard/give?tab=impact",
        icon: HeartHandshake,
        roles: ["superadmin", "admin"],
      },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    children: [
      {
        label: "All Customers",
        url: "/dashboard/user",
        icon: UserRound,
        roles: ["superadmin", "admin"],
      },
      {
        label: "Seller Verification",
        url: "/dashboard/user?tab=verification",
        icon: ShieldCheck,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
    ],
  },
  {
    label: "Trust & Safety",
    icon: ShieldAlert,
    children: [
      {
        label: "Disputes",
        url: "/dashboard/disputes",
        icon: Gavel,
        roles: ["superadmin", "admin", "supportagent"],
      },
      {
        label: "Risk & Fraud Review",
        url: "/dashboard/risk",
        icon: AlertTriangle,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    children: [
      {
        label: "Overview",
        url: "/dashboard/finance/overview",
        icon: PieChart,
        roles: ["superadmin", "admin"],
      },
      {
        label: "Transactions",
        url: "/dashboard/finance/transactions",
        icon: Receipt,
        roles: ["superadmin", "admin"],
      },
      {
        label: "Ledger",
        url: "/dashboard/finance/ledger",
        icon: BookOpen,
        roles: ["superadmin", "admin"],
      },
      {
        label: "Seller Balances",
        url: "/dashboard/finance/seller-balances",
        icon: HandCoins,
        roles: ["superadmin", "admin"],
      },
      {
        label: "Withdrawals",
        url: "/dashboard/finance/withdrawals",
        icon: Banknote,
        roles: ["superadmin", "admin"],
      },
      {
        label: "Refunds",
        url: "/dashboard/finance/refunds",
        icon: Undo2,
        roles: ["superadmin", "admin"],
      },
    ],
  },
  {
    label: "Content & Blog",
    icon: Newspaper,
    children: [
      {
        label: "Overview",
        url: "/dashboard/blog",
        icon: Newspaper,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Posts",
        url: "/dashboard/blog/posts",
        icon: FileText,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Categories & Tags",
        url: "/dashboard/blog/categories",
        icon: FolderTree,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Media Library",
        url: "/dashboard/blog/media",
        icon: Images,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    children: [
      {
        label: "Coupons & Campaigns",
        url: "/dashboard/coupons",
        icon: Tag,
        roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
      },
      {
        label: "Referral & Earn",
        url: "/dashboard/marketing/referrals",
        icon: UserPlus,
        roles: ["superadmin", "admin"],
      },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart2,
    children: [
      {
        label: "Reports",
        url: "/dashboard/reports",
        icon: TrendingUp,
        roles: ["superadmin", "admin"],
      },
    ],
  },
  {
    label: "AI Studio",
    icon: Sparkles,
    url: "/dashboard/ai-studio",
  },
  {
    label: "Administration",
    icon: Landmark,
    children: [
      {
        label: "Team",
        url: "/dashboard/team",
        icon: UsersRound,
        roles: ["superadmin"],
      },
      {
        label: "Activity Log",
        url: "/dashboard/activity",
        icon: Activity,
        roles: ["superadmin"],
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "General",
        url: "/dashboard/setting",
        icon: Settings,
        roles: STANDALONE_ROLES,
      },
      {
        // Changes real commission/withdrawal-fee math for every future
        // order -- visible to admin+superadmin (matches the backend's
        // GET /api/admin/fees gating), but the page itself only lets a
        // superadmin actually save (matches PUT's SUPER_ADMIN-only gating).
        label: "Payments & Fees",
        url: "/dashboard/settings/payments",
        icon: Percent,
        roles: ["superadmin", "admin"],
      },
    ],
  },
];

export interface FlatNavItem {
  id: string; // stable key, also the localStorage identity for pinned/recent
  label: string; // full breadcrumb-style label, e.g. "Trust & Safety > Disputes"
  url: string;
  icon: LucideIcon;
  roles: string[];
}

// Flattened, searchable list of every real destination in the app -- what
// the command palette searches over. Built once from navGroups so it can
// never list a page the sidebar doesn't actually have (or vice versa).
export const flatNavItems: FlatNavItem[] = navGroups.flatMap((entry) => {
  if (entry.url) {
    return [{ id: entry.url, label: entry.label, url: entry.url, icon: entry.icon, roles: STANDALONE_ROLES }];
  }
  return (entry.children ?? []).map((child) => ({
    id: child.url,
    label: `${entry.label} → ${child.label}`,
    url: child.url,
    icon: child.icon,
    roles: child.roles,
  }));
});
