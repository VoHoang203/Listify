import { useState } from "react";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { useChatSocket } from "../hooks/useChatQueries"; // lắng nghe socket để đẩy tin nhắn vào cache

const ChatPage = () => {
  // state chọn user chuyển từ store sang local state cha
  const [selectedUser, setSelectedUser] = useState(null);

  // kích hoạt socket listener (đẩy msg mới vào cache)
  useChatSocket();

  return (
    <div className="h-screen bg-base-200 ">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-green-100 text-black rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />

            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <ChatContainer selectedUser={selectedUser} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
