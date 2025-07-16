"use client";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react";
import Image from "next/image";
import { useSocket } from "../hooks/useSocket";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  Sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    role: string;
  };
}

interface ChatInterfaceProps {
  conversationId: number;
  onBack?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onBack,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    // socket,
    isConnected,
    joinConversation,
    sendMessage,
    markAsRead,
    setTyping,
    messages,
    currentConversation,
    onlineUsers,
    error,
  } = useSocket();

  // Join conversation when component mounts or conversationId changes
  useEffect(() => {
    // if (conversationId && isConnected && socket) {
    if (conversationId && isConnected) {
      joinConversation(conversationId);
    }
    // }
  }, [isConnected, conversationId, error, joinConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId !== getCurrentUserId()
      );
      if (unreadMessages.length > 0) {
        markAsRead(
          conversationId,
          unreadMessages.map((msg) => msg.id)
        );
      }
    }
  }, [conversationId, messages, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getCurrentUserId = () => {
    // This should come from your auth context or user state
    // For now, we'll assume it's available from the socket or auth hook
    return 1; // Replace with actual current user ID
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversationId) return;

    sendMessage(conversationId, messageInput.trim());
    setMessageInput("");

    // Stop typing indicator
    if (isTyping) {
      setTyping(conversationId, false);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      setTyping(conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(conversationId, false);
    }, 1000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 mb-2">
            {conversationId
              ? "Loading conversation..."
              : "Select a conversation to start chatting"}
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
          )}
          <div className="relative">
            <Image
              src={currentConversation.User?.avatar || "/Elipse 5.svg"}
              alt="User Avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentConversation.User
                ? `${currentConversation.User.firstName} ${currentConversation.User.lastName}`
                : "Unknown User"}
            </h3>
            <p className="text-sm text-gray-500">
              {isConnected ? "Online" : "Offline"} • {onlineUsers.length} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Phone size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Video size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                {formatDate(date)}
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              // Determine if the message is from the admin (current user)
              const isAdmin = message.Sender?.role?.toLowerCase() === "admin";
              const showAvatar =
                !isAdmin &&
                (index === 0 ||
                  dayMessages[index - 1]?.senderId !== message.senderId);

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isAdmin ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* User avatar (left side for user messages) */}
                  {!isAdmin && (
                    <div className="w-8">
                      {showAvatar && (
                        <Image
                          src={message.Sender.avatar || "/Elipse 5.svg"}
                          alt="Sender Avatar"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      isAdmin ? "order-1" : ""
                    }`}
                  >
                    {showAvatar && !isAdmin && (
                      <div className="text-xs text-gray-500 mb-1 px-3">
                        {message.Sender.firstName} {message.Sender.lastName}
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isAdmin
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>

                    <div
                      className={`text-xs text-gray-500 mt-1 px-3 ${
                        isAdmin ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                      {isAdmin && (
                        <span className="ml-1">
                          {message.isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
            <Paperclip size={20} className="text-gray-600" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim() || !isConnected}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>

        {!isConnected && (
          <div className="text-center text-sm text-red-500 mt-2">
            Disconnected from server. Trying to reconnect...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
