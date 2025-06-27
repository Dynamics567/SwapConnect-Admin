import SettingsContent from "@/components/SettingsContent";
import React from "react";

function Page() {
  return (
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <SettingsContent />
    </div>
  );
}

export default Page;
