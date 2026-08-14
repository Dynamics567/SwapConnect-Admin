"use client";

import { useState } from "react";
import { X, Monitor, Tablet, Smartphone } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  categoryName?: string;
  authorName?: string;
}

const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" },
} as const;

export default function PreviewModal({
  open, onClose, title, excerpt, content, coverImageUrl, coverImageAlt, categoryName, authorName,
}: PreviewModalProps) {
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#e5e7eb]">
        <div className="flex items-center gap-1 bg-[#F7F8FB] rounded-lg p-1">
          {(Object.entries(VIEWPORTS) as [keyof typeof VIEWPORTS, typeof VIEWPORTS[keyof typeof VIEWPORTS]][]).map(
            ([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    viewport === key ? "bg-white text-[#037F44] shadow-sm" : "text-[#6b6b6b]"
                  }`}
                >
                  <Icon size={14} /> {cfg.label}
                </button>
              );
            }
          )}
        </div>
        <button onClick={onClose} className="text-[#6b6b6b] hover:text-[#353535] p-2 rounded-lg hover:bg-[#F7F8FB]">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex justify-center bg-[#E5E7EB] py-8">
        <div
          className="bg-white shadow-2xl transition-all duration-200 min-h-full"
          style={{ width: VIEWPORTS[viewport].width, maxWidth: viewport === "desktop" ? "1024px" : VIEWPORTS[viewport].width }}
        >
          <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            {categoryName && (
              <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1 mb-4">
                {categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3 leading-tight">{title || "Untitled Post"}</h1>
            {excerpt && <p className="text-base sm:text-lg text-gray-600 mb-6">{excerpt}</p>}
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-8">
              <span className="font-medium text-gray-700">{authorName || "SwapConnect Team"}</span>
              <span>·</span>
              <span>Preview</span>
            </div>
            {coverImageUrl && (
              <div className="relative w-full h-64 sm:h-96 rounded-lg overflow-hidden bg-gray-100 mb-8">
                {/* Plain img -- this is a lightweight preview modal, not the real site */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImageUrl} alt={coverImageAlt || title} className="w-full h-full object-cover" />
              </div>
            )}
            <div
              className="prose prose-neutral max-w-none text-gray-700 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-green-700 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_img]:rounded-lg [&_.callout]:rounded-lg [&_.callout]:p-4 [&_.callout]:my-3 [&_.callout-info]:bg-blue-50 [&_.callout-warning]:bg-amber-50 [&_.callout-success]:bg-green-50 [&_.cta-button]:inline-block [&_.cta-button]:bg-green-700 [&_.cta-button]:text-white [&_.cta-button]:px-5 [&_.cta-button]:py-2.5 [&_.cta-button]:rounded-lg [&_.cta-button]:no-underline [&_figcaption]:text-xs [&_figcaption]:text-gray-400 [&_figcaption]:text-center"
              dangerouslySetInnerHTML={{ __html: content || "<p><em>Nothing written yet.</em></p>" }}
            />
          </article>
        </div>
      </div>
    </div>
  );
}
