import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("orbit_token");
  if (!token) return null;
  if (socket?.connected) return socket;

  const serverUrl = import.meta.env.VITE_API_URL || "";

  socket = io(serverUrl, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}