// hooks/useChatQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import api from '../lib/axios';                // <— default export axios instance
import { useSocket } from '../context/SocketProvider'; // <— socket từ provider bạn đã bọc

/* ======================== USERS (sidebar) ======================== */
// BE: GET /messages/users
// - customer đăng nhập: trả về list seller (theo Store) [{ _id, name, email, role, avatar, storeId, storeName }]
// - seller đăng nhập: trả về list customer đã nhắn vào shop
export const useChatUsers = () => {
  return useQuery({
    queryKey: ['chat', 'users'],
    queryFn: async () => {
      const res = await api.get('/messages/users');
      return res.data;
    },
    staleTime: 60_000,
    onError: (err) =>
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to fetch users'),
  });
};

/* ======================== MESSAGES (1-1) ======================== */
// BE: GET /messages/:userId  -> trả full đoạn chat giữa mình và userId
export const useChatMessages = (userId) => {
  return useQuery({
    enabled: !!userId,
    queryKey: ['chat', 'messages', userId],
    queryFn: async () => {
      const res = await api.get(`/messages/${userId}`);
      return res.data; // [{ _id, senderId, receiverId, text, image?, createdAt, ... }]
    },
    staleTime: 30_000,
    onError: (err) =>
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to fetch messages'),
  });
};

/* ======================== SEND MESSAGE ======================== */
// BE: POST /messages/send/:userId   -> body: { text?, image? }
export const useSendMessage = (userId) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/messages/send/${userId}`, payload);
      return res.data; // server message (đã có _id thật, createdAt, ...)
    },

    // Optimistic UI
    onMutate: async (payload) => {
      const key = ['chat', 'messages', userId];
      await qc.cancelQueries({ queryKey: key });

      const previous = qc.getQueryData(key) || [];
      const tempId = `temp-${Date.now()}`;

      const optimisticMsg = {
        _id: tempId,
        text: payload.text || '',
        image: payload.image || null,
        isMine: true,               // để UI canh phải
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData(key, (old = []) => [...old, optimisticMsg]);
      return { previous, tempId };
    },

    onError: (_err, _vars, ctx) => {
      const key = ['chat', 'messages', userId];
      qc.setQueryData(key, ctx?.previous || []);
      toast.error('Send failed');
    },

    onSuccess: (serverMsg, _vars, ctx) => {
      const key = ['chat', 'messages', userId];
      qc.setQueryData(key, (old = []) =>
        old.map((m) => (m._id === ctx?.tempId ? serverMsg : m))
      );
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', userId] });
      // tuỳ chọn: cập nhật sidebar (last message/unread)
      qc.invalidateQueries({ queryKey: ['chat', 'users'] });
    },
  });
};

/* ======================== SOCKET -> PUSH REALTIME ======================== */
// Server emit: io.to(receiverSocketId).emit("newMessage", savedMessage)
export const useChatSocket = () => {
  const qc = useQueryClient();
  const { socket } = useSocket(); // <— lấy socket từ SocketProvider

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      // Giả định client là người nhận -> cuộc hội thoại key = senderId
      const key = ['chat', 'messages', msg.senderId];
      qc.setQueryData(key, (old = []) => [...old, msg]);

      // (tuỳ chọn) cập nhật sidebar
      qc.invalidateQueries({ queryKey: ['chat', 'users'] });
    };

    socket.on('newMessage', onNewMessage);
    return () => socket.off('newMessage', onNewMessage);
  }, [socket, qc]);
};
