import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useUserStore } from "../stores/useUserStore"; // thay cho useAuthStore
import { useChatMessages } from "../hooks/useChatQueries";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = ({ selectedUser }) => {
  const { user: authUser } = useUserStore(); 
  const { data: messages = [], isLoading: isMessagesLoading } = useChatMessages(selectedUser._id);
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader selectedUser={selectedUser} onClose={() => window.history.back()} />
        <MessageSkeleton />
        <MessageInput selectedUser={selectedUser} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader selectedUser={selectedUser} onClose={() => history.back()} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const mine = String(message.senderId) === String(authUser?._id);
          return (
            <div
              key={message._id}
              className={`chat ${mine ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      mine
                        ? authUser?.profilePic || "/avatar.png"
                        : selectedUser.avatar || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput selectedUser={selectedUser} />
    </div>
  );
};

export default ChatContainer;
