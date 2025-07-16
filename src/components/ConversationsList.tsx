"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Search, MessageCircle, Clock, User } from "lucide-react";
import Image from "next/image";
import { useSocket } from "../hooks/useSocket";
import { API_URL } from "../lib/config";
import { useAuthToken } from "../hooks/useAuthToken";

// Define types above your component:
interface Message {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId?: number;
  Sender?: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
    role?: string;
  };
}

interface Conversation {
  id: number;
  user: number;
  admin?: number;
  subject: string;
  status: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  Admin?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  Messages?: Message[];
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: number;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  onSelectConversation,
  selectedConversationId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "open" | "closed">(
    "all"
  );

  const token = useAuthToken();
  const { socket, isConnected } = useSocket();

  // Fetch conversations from API
  const fetchConversations = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [token, fetchConversations]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewUserMessage = (data: {
      conversationId: number;
      message: Message;
      conversation: Conversation;
    }) => {
      console.log("New user message received:", data);

      // Update the conversation in the list
      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (conv) => conv.id === data.conversationId
        );

        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessageAt: data.message.createdAt,
            Messages: [data.message],
          };

          // Move to top
          const [updatedConv] = updated.splice(existingIndex, 1);
          return [updatedConv, ...updated];
        } else {
          // Add new conversation if it doesn't exist
          return [data.conversation, ...prev];
        }
      });
    };

    socket.on("newUserMessage", handleNewUserMessage);

    return () => {
      socket.off("newUserMessage", handleNewUserMessage);
    };
  }, [socket]);

  // Filter conversations based on search and status
  useEffect(() => {
    let filtered = conversations;

    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter((conv) => conv.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((conv) => {
        const userName = conv.User
          ? `${conv.User.firstName} ${conv.User.lastName}`.toLowerCase()
          : "";
        const email = conv.User?.email?.toLowerCase() || "";
        const subject = conv.subject.toLowerCase();

        return (
          userName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase()) ||
          subject.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Sort by last message time
    filtered.sort((a, b) => {
      const aTime = new Date(a.lastMessageAt || a.updatedAt).getTime();
      const bTime = new Date(b.lastMessageAt || b.updatedAt).getTime();
      return bTime - aTime;
    });

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, filter]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUnreadCount = (conversation: Conversation) => {
    // This would need to be calculated based on actual unread messages
    // For now, we'll show a simple indicator for pending conversations
    return conversation.status === "pending" ? 1 : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="text-gray-500">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Support Chat
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-xs text-gray-500">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            {(["all", "pending", "open", "closed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                  filter === status
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-red-500 text-sm">
              {error}
              <button
                onClick={fetchConversations}
                className="block mx-auto mt-2 text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => {
                const unreadCount = getUnreadCount(conversation);
                const isSelected = selectedConversationId === conversation.id;
                const lastMessage = conversation.Messages?.[0];

                return (
                  <div
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Image
                          src={
                            `${conversation.User?.avatar}` || "/Elipse 5.svg"
                          }
                          alt="User Avatar"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.User
                              ? `${conversation.User.firstName} ${conversation.User.lastName}`
                              : "Unknown User"}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                conversation.status
                              )}`}
                            >
                              {conversation.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-1">
                          {lastMessage?.content || conversation.subject}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(
                              conversation.lastMessageAt ||
                                conversation.updatedAt
                            )}
                          </span>
                          {conversation.Admin && (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {conversation.Admin.firstName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsList;
