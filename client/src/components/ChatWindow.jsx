import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Send, Menu, Users, MessageCircle } from 'lucide-react';

function ChatWindow({ socket, conversation, sidebarOpen, setSidebarOpen }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !conversation) return;

    // Join conversation
    socket.emit('join_conversation', conversation._id);

    // Listen for messages
    socket.on('conversation_messages', (msgs) => {
      setMessages(msgs);
    });

    socket.on('receive_message', (message) => {
      if (message.conversationId === conversation._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('user_typing', ({ username, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return [...prev.filter(u => u !== username), username];
        } else {
          return prev.filter(u => u !== username);
        }
      });
    });

    return () => {
      socket.off('conversation_messages');
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !conversation) return;

    socket.emit('send_message', {
      conversationId: conversation._id,
      content: newMessage,
      messageType: 'text'
    });

    setNewMessage('');
    handleTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (isTyping) => {
    if (!socket || !conversation) return;

    socket.emit('typing', {
      conversationId: conversation._id,
      isTyping
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
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getConversationName = () => {
    if (!conversation) return '';
    if (conversation.isGroup) return conversation.groupName;
    const otherUser = conversation.participants.find(p => p.clerkId !== user?.id);
    return otherUser?.username || 'Unknown';
  };

  const getConversationImage = () => {
    if (!conversation) return '';
    if (conversation.isGroup) return null;
    const otherUser = conversation.participants.find(p => p.clerkId !== user?.id);
    return otherUser?.imageUrl || '';
  };

  const getOnlineStatus = () => {
    if (!conversation || conversation.isGroup) return false;
    const otherUser = conversation.participants.find(p => p.clerkId !== user?.id);
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
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="relative flex-shrink-0">
          {conversation.isGroup ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {conversation.participants.length}
            </div>
          ) : (
            <>
              <img
                src={getConversationImage()}
                alt={getConversationName()}
                className="w-10 h-10 rounded-full"
              />
              {getOnlineStatus() && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </>
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">
            {getConversationName()}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.isGroup
              ? `${conversation.participants.length} members`
              : getOnlineStatus()
              ? 'Online'
              : 'Offline'}
          </p>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Users className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isOwn = msg.sender.clerkId === user?.id;
          const showAvatar = index === 0 || messages[index - 1].sender._id !== msg.sender._id;
          
          return (
            <div key={msg._id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0">
                {showAvatar ? (
                  <img 
                    src={msg.sender.imageUrl} 
                    alt={msg.sender.username} 
                    className="w-8 h-8 rounded-full" 
                  />
                ) : (
                  <div className="w-8" />
                )}
              </div>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-md`}>
                {showAvatar && !isOwn && (
                  <span className="text-xs text-gray-500 mb-1 px-3">
                    {msg.sender.username}
                  </span>
                )}
                <div className={`px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-200 text-gray-900 rounded-tl-sm'
                }`}>
                  <p className="break-words">{msg.content}</p>
                </div>
                <span className="text-xs text-gray-400 mt-1 px-3">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <span>{typingUsers[0]} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;