import { useEffect, useMemo, useState } from "react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { useChatUsers } from "../hooks/useChatQueries";
import { useSocket } from "../context/SocketProvider";

const Sidebar = ({ selectedUser, onSelectUser }) => {
  const { data: users = [], isLoading } = useChatUsers();
  const { onlineUsers } = useSocket();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // filter online (client)
  const filteredUsers = useMemo(() => {
    if (!showOnlineOnly) return users;
    return users.filter((u) => onlineUsers.includes(u._id));
  }, [users, showOnlineOnly, onlineUsers]);

  useEffect(() => {
    // nếu selectedUser không còn trong list (VD: đổi role) -> clear
    if (selectedUser && !users.find((u) => u._id === selectedUser._id)) {
      onSelectUser(null);
    }
  }, [users, selectedUser, onSelectUser]);

  if (isLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({Math.max(onlineUsers.length - 1, 0)} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const isActive = selectedUser?._id === user._id;
          const online = onlineUsers.includes(user._id);

          return (
            <button
              key={user._id}
              onClick={() => onSelectUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${isActive ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.avatar || "/avatar.png"}   // từ controller mới: avatar banner store
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {online && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-sm text-zinc-400">
                  {online ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
