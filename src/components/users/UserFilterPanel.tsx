"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

export type StatusFilter = "all" | "active" | "suspended";
export type AccountTypeFilter = "all" | "BUYER" | "STORE_OWNER" | "STAFF";
export type SortBy = "createdAt" | "name" | "amountSpent";
export type SortOrder = "asc" | "desc";

export interface UserFilterPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  accountTypeFilter: AccountTypeFilter;
  onAccountTypeFilterChange: (value: AccountTypeFilter) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  sortOptions: { value: SortBy; label: string }[];
}

const inputClass =
  "w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring focus:border-brand-emerald";

function FilterControls({
  statusFilter,
  onStatusFilterChange,
  accountTypeFilter,
  onAccountTypeFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  sortOptions,
  hasActiveFilters,
  onClear,
}: Omit<UserFilterPanelProps, "search" | "onSearchChange"> & {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#505050] mb-2">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          className={inputClass}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#505050] mb-2">Account Type</label>
        <select
          value={accountTypeFilter}
          onChange={(e) => onAccountTypeFilterChange(e.target.value as AccountTypeFilter)}
          className={inputClass}
        >
          <option value="all">All</option>
          <option value="BUYER">Buyer</option>
          <option value="STORE_OWNER">Store Owner</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#505050] mb-2">Sort By</label>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortBy)}
            className={`${inputClass} flex-1`}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
            className={inputClass}
            aria-label="Sort direction"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>
      {hasActiveFilters && (
        <button onClick={onClear} className="text-xs text-brand-emerald hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function UserFilterPanel(props: UserFilterPanelProps) {
  const { search, onSearchChange } = props;
  const [showDesktopPanel, setShowDesktopPanel] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const hasActiveFilters =
    props.statusFilter !== "all" ||
    props.accountTypeFilter !== "all" ||
    props.sortBy !== "createdAt" ||
    props.sortOrder !== "desc";

  const clearAll = () => {
    props.onStatusFilterChange("all");
    props.onAccountTypeFilterChange("all");
    props.onSortByChange("createdAt");
    props.onSortOrderChange("desc");
  };

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="relative w-full min-w-0 md:flex-1 md:max-w-[750px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring focus:border-brand-emerald bg-white"
        />
      </div>

      {/* Desktop: inline popover */}
      <div className="relative hidden lg:block shrink-0">
        <button
          onClick={() => setShowDesktopPanel((v) => !v)}
          className="flex items-center gap-2 bg-white border border-brand-emerald text-brand-emerald px-4 py-2 rounded hover:bg-brand-emerald-light transition-colors"
          aria-expanded={showDesktopPanel}
          aria-haspopup="true"
        >
          <Filter size={18} />
          Filter
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-emerald" />}
        </button>
        {showDesktopPanel && (
          <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-20 p-4">
            <FilterControls {...props} hasActiveFilters={hasActiveFilters} onClear={clearAll} />
          </div>
        )}
      </div>

      {/* Mobile/Tablet: reachable trigger opening a slide-in drawer (same mechanism as the nav drawer) */}
      <button
        onClick={() => setShowMobileDrawer(true)}
        className="lg:hidden flex items-center justify-center gap-2 bg-white border border-brand-emerald text-brand-emerald px-4 py-2 min-h-[44px] rounded hover:bg-brand-emerald-light transition-colors shrink-0"
        aria-label="Open filters"
      >
        <Filter size={18} />
        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-emerald" />}
      </button>

      {showMobileDrawer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex lg:hidden justify-end">
          <div className="flex-1" onClick={() => setShowMobileDrawer(false)} />
          <div className="bg-white w-80 max-w-[85vw] h-full shadow-lg p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#353535]">Filters</h2>
              <button
                onClick={() => setShowMobileDrawer(false)}
                aria-label="Close filters"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#848484] hover:text-[#353535]"
              >
                <X size={20} />
              </button>
            </div>
            <FilterControls {...props} hasActiveFilters={hasActiveFilters} onClear={clearAll} />
            <button
              onClick={() => setShowMobileDrawer(false)}
              className="mt-6 w-full min-h-[44px] bg-brand-emerald text-white rounded-lg text-sm font-medium hover:bg-brand-emerald-hover transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
