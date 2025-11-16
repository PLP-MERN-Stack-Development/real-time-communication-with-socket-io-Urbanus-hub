import { useUser, useClerk } from '@clerk/clerk-react';
import { Search, Plus, LogOut, Moon, Sun, MessageCircle } from 'lucide-react';
import { useState } from 'react';

function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  onNewChat,
  sidebarOpen,
  setSidebarOpen 
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getConversationName = (conv) => {
    if (conv.isGroup) return conv.groupName;
    const otherUser = conv.participants.find(p => p.clerkId !== user?.id);
    return otherUser?.username || 'Unknown';
  };

  const getConversationImage = (conv) => {
    if (conv.isGroup) {
      return conv.participants.slice(0, 2).map(p => p.imageUrl);
    }
    const otherUser = conv.participants.find(p => p.clerkId !== user?.id);
    return [otherUser?.imageUrl || ''];
  };

  const getOnlineStatus = (conv) => {
    if (conv.isGroup) return false;
    const otherUser = conv.participants.find(p => p.clerkId !== user?.id);
    return otherUser?.isOnline || false;
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!sidebarOpen) return null;

  return (
    <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
      {/* Header */}
      <div className={`p-4 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} border-b`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.imageUrl}
              alt={user?.firstName}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <h2 className="font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-xs text-blue-100">Online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400' 
                : 'bg-white/20 text-white placeholder-white/70'
            } focus:outline-none focus:ring-2 focus:ring-white/30`}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <MessageCircle className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No conversations yet
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Start a new chat to begin messaging
            </p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const images = getConversationImage(conv);
            const name = getConversationName(conv);
            const isOnline = getOnlineStatus(conv);
            
            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 transition-colors ${
                  selectedConversation?._id === conv._id
                    ? darkMode ? 'bg-gray-700' : 'bg-blue-50'
                    : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {conv.isGroup ? (
                    <div className="grid grid-cols-2 gap-0.5 w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
                      {images.slice(0, 4).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <img src={images[0]} alt={name} className="w-12 h-12 rounded-full" />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {name}
                    </h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New Chat Button */}
      <div className={`p-4 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t`}>
        <button 
          onClick={onNewChat}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>
    </div>
  );
}

export default ConversationList;