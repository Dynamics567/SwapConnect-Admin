"use client";
import React, { useState } from "react";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState<
    "personal" | "security" | "notification"
  >("personal");
  const [image, setImage] = useState<string | null>(null);

  // Dummy state for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <>
      <div className="flex gap-10 mb-6">
        <button
          className={`text-base font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "personal"
              ? "border-[#037F44] text-[#037F44]"
              : "border-transparent text-gray-500 hover:text-[#037F44]"
          }`}
          onClick={() => setActiveTab("personal")}
        >
          Personal Information
        </button>
        <button
          className={`text-base font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "security"
              ? "border-[#037F44] text-[#037F44]"
              : "border-transparent text-gray-500 hover:text-[#037F44]"
          }`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
        <button
          className={`text-base font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "notification"
              ? "border-[#037F44] text-[#037F44]"
              : "border-transparent text-gray-500 hover:text-[#037F44]"
          }`}
          onClick={() => setActiveTab("notification")}
        >
          Notification
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow p-6 mt-0">
        {activeTab === "personal" && (
          <form className="flex flex-col gap-4">
            <div className="flex flex-col items-center mb-4">
              <label htmlFor="profile-image" className="cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                  {image ? (
                    <img
                      src={image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-4xl">👤</span>
                  )}
                </div>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <span className="text-xs text-gray-500 mt-2">
                Click to change image
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm mb-1 text-[#505050]">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1 text-[#505050]">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm mb-1 text-[#505050]">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1 text-[#505050]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
            >
              Save Changes
            </button>
          </form>
        )}

        {activeTab === "security" && (
          //   <form className="flex flex-col gap-4">
          //     <div>
          //       <label className="block text-sm mb-1 text-[#505050]">
          //         Password
          //       </label>
          //       <input
          //         type="password"
          //         className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
          //         value={password}
          //         onChange={(e) => setPassword(e.target.value)}
          //       />
          //     </div>
          //     <div className="flex items-center gap-2">
          //       <input
          //         type="checkbox"
          //         id="2fa"
          //         checked={twoFactor}
          //         onChange={(e) => setTwoFactor(e.target.checked)}
          //         className="accent-[#037F44]"
          //       />
          //       <label htmlFor="2fa" className="text-sm text-[#505050]">
          //         Enable 2-Factor Authentication
          //       </label>
          //     </div>
          //     <button
          //       type="submit"
          //       className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
          //     >
          //       Save Security Settings
          //     </button>
          //   </form>
          <div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Password Card */}
              <div className="flex-1 bg-[#F8F9FB] border border-[#E5E7EB] rounded-lg p-6 flex md:w-[462px] w-[311px] h-[56px] items-center justify-between">
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value="********" // Placeholder for current password
                    readOnly // Should always be read-only here
                    className="text-[#9D99AC] text-[12px] bg-transparent outline-none"
                  />
                </div>
                <button
                  className="flex items-center gap-1 text-[#037F44] hover:underline"
                  onClick={() => setShowPasswordModal(true)}
                  title="Edit Password"
                >
                  <Pencil size={16} /> {/* Added size for consistency */}
                </button>
              </div>
              {/* 2FA Card */}
              <div className="flex-1 bg-[#F8F9FB] border border-[#E5E7EB] md:w-[462px] w-[311px] h-[56px] rounded-lg p-6 flex items-center justify-between">
                <div>
                  <div className="text-[#353535] font-semibold mb-1">
                    Enable 2FA{" "}
                  </div>
                  <div className="text-[#848484] text-sm">
                    {twoFAEnabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <button
                  className={`flex items-center gap-1 ${
                    twoFAEnabled
                      ? "text-[#037F44] hover:text-[#025c32]" // Green when enabled
                      : "text-[#F87171] hover:text-[#d32f2f]" // Red when disabled
                  }`}
                  onClick={() => setTwoFAEnabled((v) => !v)}
                  title={twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                >
                  {twoFAEnabled ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>
              </div>
            </div>
            {/* Password Modal (optional, for demo just close on click) */}
            {showPasswordModal && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Change Password</h3>
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full border border-[#E5E7EB] rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#037F44]"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full border border-[#E5E7EB] rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#037F44]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded-md bg-[#F8F9FB] text-[#353535] border border-[#E5E7EB]"
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-md bg-[#037F44] text-white font-semibold"
                      onClick={() => {
                        alert("Password changed (demo)");
                        setShowPasswordModal(false);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notification" && (
          //   <form className="flex flex-col gap-4">
          //     <div className="flex items-center gap-2">
          //       <input
          //         type="checkbox"
          //         id="notify-email"
          //         checked={notifyEmail}
          //         onChange={(e) => setNotifyEmail(e.target.checked)}
          //         className="accent-[#037F44]"
          //       />
          //       <label htmlFor="notify-email" className="text-sm text-[#505050]">
          //         Email Notifications
          //       </label>
          //     </div>
          //     <div className="flex items-center gap-2">
          //       <input
          //         type="checkbox"
          //         id="notify-inapp"
          //         checked={notifyInApp}
          //         onChange={(e) => setNotifyInApp(e.target.checked)}
          //         className="accent-[#037F44]"
          //       />
          //       <label htmlFor="notify-inapp" className="text-sm text-[#505050]">
          //         In-App Notifications
          //       </label>
          //     </div>
          //     <button
          //       type="submit"
          //       className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
          //     >
          //       Save Notification Settings
          //     </button>
          //   </form>
          <div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Email Notification Toggle */}
              <div className="flex-1 bg-[#F7F7FD] border border-[#E5E7EB] rounded-lg p-6 flex items-center justify-between md:w-[462px] w-[311px] h-[56px]">
                <div>
                  <div className="text-[#4D4D4D] text-[16px] mb-1">
                    Email Notification
                  </div>
                  {/* Display current status for clarity */}
                  <div className="text-[#848484] text-sm">
                    {emailEnabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <button
                  className={`flex items-center gap-1 ${
                    emailEnabled
                      ? "text-[#037F44] hover:text-[#025c32]"
                      : "text-[#F87171] hover:text-[#d32f2f]"
                  }`}
                  onClick={() => setEmailEnabled((v) => !v)}
                  title={emailEnabled ? "Disable Email" : "Enable Email"}
                >
                  {emailEnabled ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>
              </div>
              {/* In-App Notification Toggle (assuming this is what SMS was meant to be) */}
              <div className="flex-1 bg-[#F7F7FD] border border-[#E5E7EB] rounded-lg p-6 flex items-center justify-between md:w-[462px] w-[311px] h-[56px]">
                <div>
                  <div className="text-[#4D4D4D] text-[16px] mb-1">
                    In-App Notification
                  </div>
                  {/* Display current status for clarity */}
                  <div className="text-[#848484] text-sm">
                    {smsEnabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <button
                  className={`flex items-center gap-1 ${
                    smsEnabled
                      ? "text-[#037F44] hover:text-[#025c32]"
                      : "text-[#F87171] hover:text-[#d32f2f]"
                  }`}
                  onClick={() => setSmsEnabled((v) => !v)}
                  title={smsEnabled ? "Disable In-App" : "Enable In-App"}
                >
                  {smsEnabled ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
