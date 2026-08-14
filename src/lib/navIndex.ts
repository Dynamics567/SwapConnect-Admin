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
        label: "Transactions",
        url: "/dashboard/wallet",
        icon: Receipt,
        roles: ["superadmin", "supportagent", "verificationofficer"],
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
    url: "/dashboard/setting",
  },
];

// Dashboard, AI Studio, and Settings are standalone -- every signed-in staff
// role sees them.
export const STANDALONE_ROLES = ["superadmin", "admin", "supportagent", "verificationofficer"];

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
