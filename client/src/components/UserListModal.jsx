import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { X, Search, Users as UsersIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function UserListModal({ onClose, onCreateConversation }) {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;

    const shouldBeGroup = selectedUsers.length > 1;
    onCreateConversation(
      selectedUsers,
      shouldBeGroup,
      shouldBeGroup ? groupName : null
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setIsGroup(selectedUsers.length > 1);
  }, [selectedUsers]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] md:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              New Chat
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Selected Users Counter */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              {isGroup && <UsersIcon className="w-5 h-5 text-blue-600" />}
            </div>
          )}

          {/* Group Name Input */}
          {isGroup && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Group name (optional)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.includes(user._id);

                return (
                  <button
                    key={user._id}
                    onClick={() => handleUserToggle(user._id)}
                    className={`w-full p-3 md:p-4 flex items-center gap-2 md:gap-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.imageUrl}
                        alt={user.username}
                        className="w-10 md:w-12 h-10 md:h-12 rounded-full object-cover"
                      />
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 md:w-3 h-2.5 md:h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                        {user.username}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="shrink-0">
                        <div className="w-5 md:w-6 h-5 md:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 md:w-4 h-3 md:h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200 flex gap-2 md:gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0}
            className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-sm md:text-base"
          >
            {isGroup ? "Create Group" : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserListModal;
