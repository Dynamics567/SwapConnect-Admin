# SwapConnect Admin — Navigation Architecture Roadmap

Full interactive version (icons, permission matrix, colored severity tags):
https://claude.ai/code/artifact/415dd06b-a798-49ae-93e5-38df7bfcf350

## The core problem

The sidebar isn't cluttered because it has too many features — it's cluttered
because it has too few *categories*. Three pairs of items already do
overlapping work, but nothing groups them:

- **Trade-Ins** duplicates **Item Management**'s own tab pattern (New Listing /
  Swap Offer / Listed Items — Trade-Ins is structurally a 4th variant of the
  same "review a submission, change its status" shape).
- **Seller Verification** and **Item Management → User Management** both edit
  the same `userId` records; Seller Verification's approve/reject/tier flow is
  really a tab that belongs on the user record it operates on.
- **Risk & Fraud Review** is explicitly self-described in-code as "a simple
  rule-based checklist, not fraud detection" — a read-only triage layer with
  no independent actions, that already links out to **Disputes**' console.

The fix is exactly one layer of hierarchy, introduced once, so the sidebar can
absorb the next 50 features without becoming item #64.

## Target navigation tree

```
▸ Dashboard                                    (standalone)
▸ Marketplace
  ├─ Listings          (New · Swap Offers · Listed · Trade-Ins)
  └─ Physical Stores
▸ Customers
  ├─ All Customers
  └─ Seller Verification
▸ Trust & Safety
  ├─ Disputes
  └─ Risk & Fraud Review
▸ Finance
  └─ Transactions                              (Payments/Payouts/Escrow join later)
▸ Marketing
  └─ Coupons & Campaigns                       (Referrals/Loyalty join later)
▸ Analytics
  └─ Reports                                   (Business Intelligence joins later)
▸ AI Studio                                    (standalone — already has its own tabs)
▸ Administration
  ├─ Team Members
  ├─ Roles & Permissions
  └─ Activity Log
▸ Settings                                     (standalone — personal account, not platform)
──────────────────────
▸ Support                                      (pinned footer)
▸ Log out                                      (pinned footer)
```

## Icon system (Lucide)

| Menu | Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Marketplace | `Store` |
| — Listings | `Package` |
| — Physical Stores | `Building2` |
| Customers | `Users` |
| — All Customers | `UserRound` |
| — Seller Verification | `ShieldCheck` |
| Trust & Safety | `ShieldAlert` |
| — Disputes | `Gavel` |
| — Risk & Fraud Review | `AlertTriangle` |
| Finance | `Wallet` |
| — Transactions | `Receipt` |
| Marketing | `Megaphone` |
| — Coupons & Campaigns | `Tag` |
| Analytics | `BarChart2` |
| — Reports | `TrendingUp` |
| AI Studio | `Sparkles` |
| Administration | `Landmark` |
| — Team Members | `UsersRound` |
| — Roles & Permissions | `KeyRound` |
| — Activity Log | `Activity` |
| Settings | `Settings` |
| Support | `HelpCircle` |
| Log out | `LogOut` |

## Permission matrix (target state)

The real backend today has exactly 4 roles (`SUPER_ADMIN`, `ADMIN`,
`SUPPORT_AGENT`, `VERIFICATION_OFFICER`). The 9-persona matrix in the full
artifact is the **target state** for when the org has grown into dedicated
Finance/Marketing/Fraud/AI/Compliance functions — not a claim those roles
exist today. Mapping:

| Target persona | Closest real role today |
|---|---|
| Ops, Support | `SUPPORT_AGENT` |
| Fraud Team, Moderators, Compliance | `VERIFICATION_OFFICER` |
| Finance, Marketing, AI Team | `ADMIN` (no dedicated role yet — highest-value next roles to add) |
| Super Admin | `SUPER_ADMIN` |

## Future modules and where they land

| Future capability | Lands in |
|---|---|
| Inventory, Product Catalog/CMS | Marketplace |
| KYC, Customer Success/CRM | Customers |
| Reviews, Content Moderation | Trust & Safety |
| Payments, Payouts, Escrow, Subscriptions | Finance |
| Referral Management, Loyalty, Notifications | Marketing |
| Business Intelligence | Analytics |
| Audit, API Management, Feature Flags, Automation/Workflow Engine, Knowledge Base | Administration |

Signal to promote a child to its own top-level module: a module growing past
~6 children (Finance's Escrow/Payments is the most likely first case), not a
fixed feature count.

## Rollout plan

1. **Phase 1 — pure regrouping, zero URL changes.** New 8-group sidebar only;
   every route stays exactly where it is. Fixes the flat-list problem with no
   backend work and no broken bookmarks.
2. **Phase 2 — the two real merges.** Trade-Ins → 4th tab in Item Management
   (Listings). Seller Verification → 2nd tab in User Management (Customers).
   Real page restructuring, not just sidebar cosmetics — shipped one at a
   time, verified live.
3. **Phase 3 — Administration grouping.** Team + Activity Log move under one
   sidebar group; Teams page keeps its existing two internal tabs (Team /
   Roles & Permission) rather than being split into separate routes — no
   restructuring needed there, just regrouping.
4. **Phase 4 — command palette + pinned/recent.** Highest-value addition,
   also the most net-new engineering (a real search index over pages and
   records). Sequence last, once the IA itself has settled.

## Sidebar behavior recommendations

- Expandable accordion groups, not hover flyouts (better for touch/tablet).
- Auto-expand whichever module contains the current page on load.
- Command palette (⌘K/Ctrl+K) — the highest-leverage single addition once
  the module count grows; jumps to a *page*.
- Global search — distinct from the palette; jumps to a *record* (a specific
  user, order, dispute, coupon code).
- Pinned/Favorites + Recently visited, above Dashboard.
- Notification badges roll up to the module level (e.g. a dot on
  Trust & Safety for a new high-risk order) — counts only, never decoration.

## Mobile & tablet

- Tablet (≥768px): full sidebar, default collapsed to icon-only with a
  pin/expand toggle.
- Phone (<768px): slide-over drawer via hamburger, reusing the customer app's
  existing mobile-nav pattern rather than inventing a second one.
- Bottom tab bar for the 4-5 highest-frequency destinations (Dashboard,
  Customers, Marketplace, Trust & Safety, Reports).
- Command palette stays available as a persistent search icon on mobile.
- Never nest more than 2 levels on mobile — module → child is fine; anything
  deeper opens as its own full screen.
