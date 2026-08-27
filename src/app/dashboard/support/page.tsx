"use client";
import type React from "react";
import { useState } from "react";
import ConversationsList from "../../../components/ConversationsList";
import ChatInterface from "../../../components/ChatInterface";

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
  Messages?: Array<{
    id: number;
    content: string;
    createdAt: string;
    isRead: boolean;
  }>;
}

const SupportPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversation(null);
  };

  return (
    // This chat UI wants edge-to-edge, viewport-bounded space (its own
    // internal panes scroll, the page itself shouldn't) unlike every other
    // dashboard page, which now gets its spacing from <main>'s padding in
    // dashboard/layout.tsx. The negative margins cancel that padding out
    // exactly (mx matches main's px-4/sm:px-6/lg:px-8, my matches py-6),
    // and the height subtracts only the sticky navbar (85px) since the
    // now-canceled padding no longer needs its own subtraction.
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6 h-[calc(100vh-85px)] flex bg-gray-50">
      {/* Conversations List - Hidden on mobile when chat is open */}
      <div
        className={`${
          showChat ? "hidden md:flex" : "flex"
        } flex-shrink-0 overflow-auto`}
      >
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?.id}
        />
      </div>

      {/* Chat Interface - Hidden on mobile when no conversation selected */}
      <div
        className={`${showChat ? "flex" : "hidden md:flex"} flex-1`}
      >
        {selectedConversation ? (
          <ChatInterface
            conversationId={selectedConversation.id}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">
                Welcome to Support Chat
              </h3>
              <p className="text-sm">
                Select a conversation from the list to start chatting with
                users.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
