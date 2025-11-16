import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { Send, Menu, Users, MessageCircle } from "lucide-react";

function ChatWindow({ socket, conversation, sidebarOpen, setSidebarOpen }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !conversation) return;

    // Join conversation
    socket.emit("join_conversation", conversation._id);

    // Listen for messages
    socket.on("conversation_messages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("receive_message", (message) => {
      if (message.conversationId === conversation._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("user_typing", ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return [...prev.filter((u) => u !== username), username];
        } else {
          return prev.filter((u) => u !== username);
        }
      });
    });

    return () => {
      socket.off("conversation_messages");
      socket.off("receive_message");
      socket.off("user_typing");
    };
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !conversation) return;

    socket.emit("send_message", {
      conversationId: conversation._id,
      content: newMessage,
      messageType: "text",
    });

    setNewMessage("");
    handleTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (isTyping) => {
    if (!socket || !conversation) return;

    socket.emit("typing", {
      conversationId: conversation._id,
      isTyping,
    });
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    handleTyping(true);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getConversationName = () => {
    if (!conversation) return "";
    if (conversation.isGroup) return conversation.groupName;
    const otherUser = conversation.participants.find(
      (p) => p.clerkId !== user?.id
    );
    return otherUser?.username || "Unknown";
  };

  const getConversationImage = () => {
    if (!conversation) return "";
    if (conversation.isGroup) return null;
    const otherUser = conversation.participants.find(
      (p) => p.clerkId !== user?.id
    );
    return otherUser?.imageUrl || "";
  };

  const getOnlineStatus = () => {
    if (!conversation || conversation.isGroup) return false;
    const otherUser = conversation.participants.find(
      (p) => p.clerkId !== user?.id
    );
    return otherUser?.isOnline || false;
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Select a conversation
          </h2>
          <p className="text-gray-400">
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white md:bg-gradient-to-b from-gray-50 to-gray-50">
      {/* Chat Header */}
      <div className="px-3 md:px-6 py-3 md:py-4 bg-white border-b border-gray-200 flex items-center justify-between gap-3 md:gap-4 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {/* Menu Button - Mobile Only */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden shrink-0"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conversation.isGroup ? (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-md">
                {conversation.participants.length}
              </div>
            ) : (
              <>
                <img
                  src={getConversationImage()}
                  alt={getConversationName()}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-md"
                />
                {getOnlineStatus() && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-white rounded-full shadow-md"></span>
                )}
              </>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-sm md:text-lg truncate">
              {getConversationName()}
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              {conversation.isGroup
                ? `${conversation.participants.length} members`
                : getOnlineStatus()
                ? "🟢 Online"
                : "⚫ Offline"}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          title="Group info"
        >
          <Users className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender.clerkId === user?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const nextMsg =
              index < messages.length - 1 ? messages[index + 1] : null;
            const showAvatar =
              !prevMsg || prevMsg.sender._id !== msg.sender._id;
            const isConsecutive =
              nextMsg && nextMsg.sender._id === msg.sender._id;

            return (
              <div
                key={msg._id}
                className={`flex gap-2 md:gap-3 ${
                  isOwn ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                {/* Avatar */}
                <div className={`shrink-0 ${isOwn ? "order-2" : "order-1"}`}>
                  {showAvatar ? (
                    <img
                      src={msg.sender.imageUrl}
                      alt={msg.sender.username}
                      className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 md:w-10 h-8 md:h-10" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col ${
                    isOwn ? "items-end order-1" : "items-start order-2"
                  } max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg`}
                >
                  {/* Username for other users */}
                  {showAvatar && !isOwn && (
                    <span className="text-xs font-semibold text-gray-600 mb-1 px-3">
                      {msg.sender.username}
                    </span>
                  )}

                  {/* Message Content */}
                  <div
                    className={`px-4 md:px-5 py-2 md:py-3 rounded-2xl shadow-md transition-all hover:shadow-lg ${
                      isOwn
                        ? "bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm md:text-base wrap-break-word">
                      {msg.content}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-400 mt-1 px-3">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex gap-2 md:gap-3 animate-fadeIn">
            <div className="shrink-0">
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-gray-200"></div>
            </div>
            <div className="flex items-center gap-2 px-4 md:px-5 py-3 bg-gray-100 rounded-2xl rounded-bl-none">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </div>
              <span className="text-xs md:text-sm text-gray-600 ml-1">
                {typingUsers[0]} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-3 md:px-6 py-3 md:py-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex gap-2 md:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 md:px-5 py-2 md:py-3 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm md:text-base"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 md:px-6 py-2 md:py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 shrink-0 shadow-md hover:shadow-lg"
            title="Send message"
          >
            <Send className="w-4 md:w-5 h-4 md:h-5" />
            <span className="hidden sm:inline text-sm md:text-base">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
