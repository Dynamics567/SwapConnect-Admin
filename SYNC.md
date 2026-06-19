# Admin Panel Sync Guide

This file documents how the admin panel stays in sync with the backend and frontend repos.

## Repos

| Repo | Purpose |
|------|---------|
| `swapconnect_backend` | Node/Express API — all data endpoints |
| `swapconnect_frontend` | Customer app |
| `swapconnect_admin` | This repo — admin panel |

## Auth Token Key

- Admin stores JWT as `token` in localStorage (set by `useAuthToken` hook)
- The `AuthContext` reads the role from `GET /api/admin/get-dashboard`
- **Never use `authToken`** — that key is for the customer frontend only

## API Base URL

Set `NEXT_PUBLIC_API_URL` in `.env.local`.

## Admin Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access — users, products, trade-ins, settings |
| `ADMIN` | Products, trade-ins, orders, support |
| `SUPPORT_AGENT` | Read + suspend user |
| `VERIFICATION_OFFICER` | Read only |

## Dashboard Layout Auth Guard

`src/app/dashboard/layout.tsx` checks `useAuthToken()` on mount and redirects to `/auth/login` if no token is found. All dashboard pages are protected.

## When the backend changes:

### New endpoint available
- Check `swapconnect_backend/API_CONTRACT.md`
- If admin UI needs to use it, create the relevant page/component
- Wire to `NEXT_PUBLIC_API_URL + /api/...` with `Authorization: Bearer ${token}`

### Trade-In Management (NEW)
The admin panel needs a trade-in review page:
- `GET /api/trade-in/admin/all?status=pending` — list pending submissions
- `PUT /api/trade-in/admin/:id/status` — approve or reject
- Create page at `src/app/dashboard/trade-ins/page.tsx`

### Admin Routes Security
All admin API routes now require `authenticate` + `authorizeRoles`. If you see 401 errors, ensure:
1. Token is valid and not expired
2. The admin role matches the required role for that endpoint

## When the frontend changes:

- Frontend product listings reflect admin approval status — no extra sync needed
- If new product fields are added in frontend, check admin product detail page shows them

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Checklist: before merging an admin PR

- [ ] No dashboard page without auth (all behind `dashboard/layout.tsx`)
- [ ] All API calls include `Authorization: Bearer ${token}` header
- [ ] Role-based UI shown/hidden correctly (e.g. delete button only for SUPER_ADMIN)
- [ ] No use of `authToken` key — always use `token`
