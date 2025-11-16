import { useAuth, useUser } from '@clerk/clerk-react';
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import UserListModal from './UserListModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function ChatApp() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize Socket.io connection
  useEffect(() => {
    const initSocket = async () => {
      const token = await getToken();
      
      const newSocket = io(API_URL, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
      });

      newSocket.on('conversations_list', (convos) => {
        setConversations(convos);
      });

      newSocket.on('conversation_created', (conversation) => {
        setConversations(prev => {
          const exists = prev.find(c => c._id === conversation._id);
          if (exists) return prev;
          return [conversation, ...prev];
        });
        setSelectedConversation(conversation);
        setShowUserList(false);
      });

      newSocket.on('receive_message', (message) => {
        setConversations(prev => {
          return prev.map(conv => {
            if (conv._id === message.conversationId) {
              return { 
                ...conv, 
                lastMessage: message, 
                lastMessageAt: new Date() 
              };
            }
            return conv;
          }).sort((a, b) => 
            new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
          );
        });
      });

      newSocket.on('user_status', ({ userId, isOnline }) => {
        setConversations(prev => 
          prev.map(conv => ({
            ...conv,
            participants: conv.participants.map(p => 
              p._id === userId ? { ...p, isOnline } : p
            )
          }))
        );
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    };

    if (user) {
      initSocket();
    }
  }, [user, getToken]);

  const handleCreateConversation = (participantIds, isGroup, groupName) => {
    if (socket) {
      socket.emit('create_conversation', {
        participantIds,
        isGroup,
        groupName
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onNewChat={() => setShowUserList(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <ChatWindow
        socket={socket}
        conversation={selectedConversation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {showUserList && (
        <UserListModal
          onClose={() => setShowUserList(false)}
          onCreateConversation={handleCreateConversation}
        />
      )}
    </div>
  );
}

export default ChatApp;