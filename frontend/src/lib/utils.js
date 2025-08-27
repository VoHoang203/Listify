export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("vi-VI", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}