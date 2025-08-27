import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

// Tùy backend của bạn
const BASE_URL =  "http://localhost:5000";

const SocketCtx = createContext(null);

export function SocketProvider({ user, children }) {
  // user: object đăng nhập hiện tại (null nếu chưa login)
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Tạo options 1 lần khi user thay đổi
  const opts = useMemo(() => {
    if (!user) return null;
    return {
      // Nếu backend cần cookie:
      withCredentials: true,
      transports: ["websocket"], // tránh polling nếu muốn
      // Nếu backend đọc từ query:
      query: { userId: user._id },
      // Hoặc nếu backend yêu cầu Bearer token:
      // extraHeaders: { Authorization: `Bearer ${token}` },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
    };
  }, [user]);

  useEffect(() => {
    // Khi chưa có user -> đảm bảo disconnect
    if (!opts) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUsers([]);
      return;
    }

    // Khởi tạo socket
    const s = io(BASE_URL, opts);
    socketRef.current = s;

    // Kết nối
    s.connect();

    // Lắng nghe sự kiện server
    const onOnline = (ids) => setOnlineUsers(ids || []);
    s.on("getOnlineUsers", onOnline);

    // (tuỳ chọn) log / debug
    // s.on("connect", () => console.log("socket connected", s.id));
    // s.on("disconnect", (r) => console.log("socket disconnected:", r));
    // s.on("connect_error", (e) => console.log("connect_error:", e.message));

    // Cleanup khi unmount hoặc khi user thay đổi
    return () => {
      s.off("getOnlineUsers", onOnline);
      s.disconnect();
      socketRef.current = null;
    };
  }, [opts]);

  const value = useMemo(() => ({
    socket: socketRef.current,
    onlineUsers,
    // tiện ích gửi event
    emit: (event, payload) => socketRef.current?.emit(event, payload),
    // chủ động connect/disconnect nếu cần
    connect: () => socketRef.current?.connect(),
    disconnect: () => socketRef.current?.disconnect(),
    isConnected: () => !!socketRef.current?.connected,
  }), [onlineUsers]);

  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketCtx);
  if (!ctx) throw new Error("useSocket must be used within <SocketProvider>");
  return ctx;
}
