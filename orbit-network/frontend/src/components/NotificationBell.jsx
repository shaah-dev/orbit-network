import { useEffect, useState } from "react";
import api from "../api.js";

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await api.put("/notifications/read");
      fetchNotifications();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" onClick={handleOpen} title="Notifications">
        <BellIcon />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {open && (
        <div style={{
          position: "fixed",
          left: 20,
          bottom: 160,
          width: 300,
          maxHeight: 380,
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border-hover)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          zIndex: 9999,
          padding: 16,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: "var(--font-display)" }}>
            Notifications
          </h3>
          {notifications.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <div key={n._id} className="notif-item">
              {n.sender?.avatar
                ? <img src={n.sender.avatar} className="avatar avatar-sm" alt="" />
                : <div className="avatar avatar-sm" style={{ background: "var(--surface-3)" }} />
              }
              <div className="notif-text">
                <strong>{n.sender?.name}</strong>{" "}
                {n.type === "like" && "liked your post"}
                {n.type === "comment" && "commented on your post"}
                {n.type === "follow" && "started following you"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}