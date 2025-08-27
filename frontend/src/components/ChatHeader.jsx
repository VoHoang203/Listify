import { X } from "lucide-react";
import { useSocket } from "../context/SocketProvider";

const ChatHeader = ({ selectedUser, onClose }) => {
  const { onlineUsers } = useSocket();
  const online = selectedUser && onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.avatar || "/avatar.png"} alt={selectedUser.name} />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.name}</h3>
            <p className="text-sm text-base-content/70">
              {online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <button onClick={onClose}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
