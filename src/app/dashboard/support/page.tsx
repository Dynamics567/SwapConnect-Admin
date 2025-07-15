"use client";
import React, { useEffect, useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import Image from "next/image";
import { API_URL } from "@/lib/config";

interface Message {
  content: string;
  isRead: boolean;
  createdAt?: string;
  from?: string; // Add this if your backend provides it
}
interface UserConversation {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  messages: Message[];
}

function SupportPage() {
  const token = useAuthToken();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<UserConversation[]>([]);

  // Fetch users and their conversations
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/conversations`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("Fetched conversations:", data);
        if (data.data) {
          setConversations(data.data);
        } else {
          setConversations([]);
        }
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  // Find the selected conversation
  const selectedConversation = conversations.find(
    (c) => c.id === selectedUserId
  );

  // Send message handler (demo only, does not persist)
  const sendMessage = () => {
    if (input.trim() && selectedConversation) {
      // For demo: add message locally
      selectedConversation.messages.push({
        content: input,
        isRead: true,
        createdAt: new Date().toISOString(),
        from: "admin",
      });
      setInput("");
      setConversations([...conversations]);
      // TODO: Send message to backend here
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="w-full max-w-4xl mx-auto flex bg-white rounded shadow overflow-hidden min-h-[500px]">
        {/* Sidebar: List of user chats */}
        <div className="w-1/3 border-r bg-[#F7F8FB] flex flex-col">
          <h3 className="text-lg font-bold text-[#037F44] p-4 border-b">
            User Chats
          </h3>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No chats found.
              </div>
            ) : (
              conversations.map((conversation) => {
                const lastMsg =
                  Array.isArray(conversation.messages) &&
                  conversation.messages.length > 0
                    ? conversation.messages[conversation.messages.length - 1]
                    : undefined;
                return (
                  <button
                    key={conversation.id}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-[#e6f4ed] transition ${
                      selectedUserId === conversation.id ? "bg-[#e6f4ed]" : ""
                    } flex items-center gap-3`}
                    onClick={() => setSelectedUserId(conversation.id)}
                  >
                    <Image
                      src={conversation.user.avatar || "/default-avatar.png"}
                      alt={
                        conversation.user.firstName +
                        " " +
                        conversation.user.lastName
                      }
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-black">
                        {conversation.user.firstName}{" "}
                        {conversation.user.lastName}
                      </div>
                      <div className="text-xs text-[#505050] truncate">
                        {lastMsg?.content || ""}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b p-4 font-bold text-[#037F44] flex items-center gap-2">
                <Image
                  src={
                    selectedConversation.user.avatar || "/default-avatar.png"
                  }
                  alt={
                    selectedConversation.user.firstName +
                    " " +
                    selectedConversation.user.lastName
                  }
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <span>
                  Chat with {selectedConversation.user.firstName}{" "}
                  {selectedConversation.user.lastName}
                </span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
                {selectedConversation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={
                      msg.from === "admin"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <span
                      className={
                        msg.from === "admin"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-black"
                      }
                      style={{
                        borderRadius: 8,
                        padding: "6px 12px",
                        display: "inline-block",
                        margin: 2,
                        maxWidth: "75%",
                        wordBreak: "break-word",
                      }}
                    >
                      <b>{msg.from === "admin" ? "You" : "User"}:</b>{" "}
                      {msg.content}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-4 border-t">
                <input
                  className="flex-1 border rounded p-2 text-black"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message to the user..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a user to view and respond to their messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportPage;
