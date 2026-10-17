import React, { JSX } from "react";

interface PageButtonProps {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
}
function PageButton({
  page,
  setPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: PageButtonProps): JSX.Element {
  const hasCount =
    typeof totalItems === "number" && typeof itemsPerPage === "number" && totalItems > 0;
  const rangeStart = hasCount ? (page - 1) * (itemsPerPage as number) + 1 : 0;
  const rangeEnd = hasCount
    ? Math.min(page * (itemsPerPage as number), totalItems as number)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-10">
      {hasCount && (
        <p className="text-xs text-[#848484]">
          Showing {rangeStart}–{rangeEnd} of {totalItems}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          disabled={page == 1}
          onClick={() => setPage(page - 1)}
          className="min-w-[44px] py-2.5 px-3 text-black border rounded disabled:opacity-50"
        >
          PREV
        </button>
        <span className="text-brand-emerald text-sm px-1">
          {page} of {totalPages || 1}
        </span>
        <button
          disabled={page == totalPages}
          onClick={() => setPage(page + 1)}
          className="min-w-[44px] py-2.5 px-3 text-black border rounded disabled:opacity-50"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}

export default PageButton;
