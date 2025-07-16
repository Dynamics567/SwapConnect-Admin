import React, { JSX } from "react";
// import { useState } from "react";

interface PageButtonProps {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}
function PageButton({
  page,
  setPage,
  totalPages,
}: PageButtonProps): JSX.Element {
  return (
    <div className="flex items-center justify-center pt-10">
      <div>
        <button
          disabled={page == 1}
          onClick={() => setPage(page - 1)}
          className="text-black border rounded px-3 py-1 mr-2 disabled:opacity-50"
        >
          PREV
        </button>
        <span className="text-blue-500">
          {page} of {totalPages}
        </span>
        <button
          disabled={page == totalPages}
          onClick={() => setPage(page + 1)}
          className="text-black border rounded px-3 py-1 ml-2 disabled:opacity-50"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}

export default PageButton;
