"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthToken } from "./useAuthToken";
import { API_URL } from "@/lib/config";

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

interface Conversation {
  id: number;
  user: number;
  admin?: number;
  subject: string;
  status: string;
  lastMessageAt?: string;
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
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: number) => void;
  sendMessage: (conversationId: number, content: string) => void;
  markAsRead: (conversationId: number, messageIds?: number[]) => void;
  setTyping: (conversationId: number, isTyping: boolean) => void;
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onlineUsers: any[];
  error: string | null;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<
    { id: number; name: string; avatar?: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthToken();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    const newSocket = io(API_URL || "http://localhost:3001", {
      auth: {
        token,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setError("Failed to connect to server");
      setIsConnected(false);
    });

    // Message event handlers
    newSocket.on(
      "conversationJoined",
      (data: { conversation: Conversation; messages: Message[] }) => {
        console.log("Joined conversation:", data);
        setCurrentConversation(data.conversation);
        setMessages(data.messages);
      }
    );

    newSocket.on("newMessage", (message: Message) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on(
      "newUserMessage",
      (data: {
        conversationId: number;
        message: Message;
        conversation: Conversation;
      }) => {
        console.log("New user message notification:", data);
        // Update conversations list to show new message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === data.conversationId
              ? { ...conv, lastMessageAt: data.message.createdAt }
              : conv
          )
        );
      }
    );

    newSocket.on(
      "messagesMarkedAsRead",
      (data: {
        conversationId: number;
        readBy: number;
        messageIds?: number[];
      }) => {
        console.log("Messages marked as read:", data);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.conversationId === data.conversationId &&
            (!data.messageIds || data.messageIds.includes(msg.id))
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    );

    newSocket.on(
      "userTyping",
      (data: { userId: number; userName: string; isTyping: boolean }) => {
        console.log("User typing:", data);
        // Handle typing indicator
      }
    );

    newSocket.on(
      "onlineUsers",
      (data: {
        conversationId: number;
        users: { id: number; name: string; avatar?: string }[];
      }) => {
        console.log("Online users:", data);
        setOnlineUsers(data.users);
      }
    );

    newSocket.on(
      "adminOnline",
      (data: { adminId: number; adminName: string }) => {
        console.log("Admin online:", data);
      }
    );

    newSocket.on(
      "adminOffline",
      (data: { adminId: number; adminName: string }) => {
        console.log("Admin offline:", data);
      }
    );

    newSocket.on("error", (data: { message: string }) => {
      // console.error('Socket error:', data);
      setError(data.message);
    });

    return () => {
      newSocket.off();
      newSocket.close();
      socketRef.current = null;
    };
  }, [token]);

  const joinConversation = (conversationId: number) => {
    if (socket && isConnected) {
      socket.emit("joinConversation", conversationId);
    }
  };

  const sendMessage = (conversationId: number, content: string) => {
    if (socket && isConnected) {
      socket.emit("sendMessage", {
        conversationId,
        content,
        messageType: "text",
      });
    }
  };

  const markAsRead = (conversationId: number, messageIds?: number[]) => {
    if (socket && isConnected) {
      socket.emit("markAsRead", {
        conversationId,
        messageIds,
      });
    }
  };

  const setTyping = (conversationId: number, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit("typing", {
        conversationId,
        isTyping,
      });
    }
  };

  return {
    socket,
    isConnected,
    joinConversation,
    sendMessage,
    markAsRead,
    setTyping,
    messages,
    conversations,
    currentConversation,
    onlineUsers,
    error,
  };
};
