import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket } from "../socket.js";

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const ImageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const GifIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M8 12h-2v-1a2 2 0 014 0v2H8" />
    <line x1="13" y1="9" x2="13" y2="15" />
    <path d="M16 9h2v2h-2v2h2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

function SharedPostPreview({ text }) {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  const url = urlMatch ? urlMatch[0] : null;
  const quoteMatch = text.match(/"([^"]+)"/);
  const quote = quoteMatch ? quoteMatch[1] : null;

  return (
    <div style={{ minWidth: 200 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        opacity: 0.8,
        marginBottom: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Shared a post
      </div>
      {quote && (
        <div style={{
          background: "rgba(255,255,255,0.12)",
          borderLeft: "3px solid rgba(255,255,255,0.5)",
          borderRadius: "0 8px 8px 0",
          padding: "8px 10px",
          fontSize: 13,
          lineHeight: 1.4,
          marginBottom: 8,
          fontStyle: "italic",
        }}>
          "{quote}"
        </div>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            fontSize: 12,
            opacity: 0.75,
            textDecoration: "underline",
            wordBreak: "break-all",
            color: "inherit",
          }}
        >
          View Post
        </a>
      )}
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

  const loadConversations = async () => {
    try {
      const { data } = await api.get("/chat/conversations");
      setConversations(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    api
      .get(`/chat/conversations/${conversationId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(console.error);

    const socket = connectSocket();
    socket?.emit("join_conversation", conversationId);
    return () => socket?.emit("leave_conversation", conversationId);
  }, [conversationId]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleNewMessage = ({ conversationId: incomingId, message }) => {
      if (incomingId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
      loadConversations();
    };

    const handleTyping = ({ isTyping }) => setTypingUser(isTyping);

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const otherPerson = (convo) =>
    convo.participants?.find((p) => p._id !== user?._id);

  const activeConvo = conversations.find((c) => c._id === conversationId);
  const activePerson = activeConvo ? otherPerson(activeConvo) : null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !conversationId) return;
    try {
      await api.post(`/chat/conversations/${conversationId}/messages`, { text });
      setText("");
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingChange = (val) => {
    setText(val);
    const socket = connectSocket();
    socket?.emit("typing", { conversationId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("typing", { conversationId, isTyping: false });
    }, 1500);
  };

  const sendHeart = async () => {
    if (!conversationId) return;
    try {
      await api.post(`/chat/conversations/${conversationId}/messages`, {
        text: "❤️",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const isSharedPost = (txt) =>
    typeof txt === "string" && txt.startsWith("📤 Shared a post");

  return (
    <div className="chat-shell">
      {/* Conversation list */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">Messages</div>

        {conversations.length === 0 && (
          <p style={{ padding: 16, color: "var(--text-dim)", fontSize: 13 }}>
            No conversations yet. Visit a profile and click "Message".
          </p>
        )}

        {conversations.map((c) => {
          const person = otherPerson(c);
          return (
            <div
              key={c._id}
              className={`convo-item ${c._id === conversationId ? "active" : ""}`}
              onClick={() => navigate(`/chat/${c._id}`)}
            >
              {person?.avatar ? (
                <img src={person.avatar} className="avatar avatar-sm" alt="" />
              ) : (
                <div
                  className="avatar avatar-sm"
                  style={{
                    background: "var(--surface-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  👤
                </div>
              )}
              <div className="convo-info">
                <div className="convo-name">{person?.name}</div>
                <div className="convo-last">
                  {isSharedPost(c.lastMessage)
                    ? "📤 Shared a post"
                    : c.lastMessage || "Say hello"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {!conversationId ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-dim)",
              fontSize: 14,
            }}
          >
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              {activePerson?.avatar ? (
                <img
                  src={activePerson.avatar}
                  className="avatar avatar-sm"
                  alt=""
                />
              ) : (
                <div
                  className="avatar avatar-sm"
                  style={{ background: "var(--surface-3)" }}
                />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {activePerson?.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  @{activePerson?.username}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((m) => {
                const isOwn =
                  m.sender?._id === user?._id || m.sender === user?._id;
                const isPost = isSharedPost(m.text);

                return (
                  <div
                    key={m._id}
                    className={`msg-row ${isOwn ? "own" : ""}`}
                  >
                    {!isOwn && (
                      activePerson?.avatar ? (
                        <img
                          src={activePerson.avatar}
                          className="avatar avatar-xs"
                          alt=""
                          style={{ marginBottom: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          className="avatar avatar-xs"
                          style={{
                            background: "var(--surface-3)",
                            marginBottom: 4,
                            flexShrink: 0,
                          }}
                        />
                      )
                    )}
                    <div
                      className={`msg-bubble ${isOwn ? "mine" : "theirs"}`}
                      style={isPost ? { padding: "12px 14px" } : {}}
                    >
                      {isPost ? (
                        <SharedPostPreview text={m.text} />
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                );
              })}

              {typingUser && (
                <div className="msg-row">
                  <div className="msg-bubble theirs typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Instagram-style input bar */}
            <div className="chat-input-bar">
              <button className="chat-icon-action" title="More">
                <PlusIcon />
              </button>
              <button className="chat-icon-action" title="Photo">
                <ImageIcon />
              </button>
              <button className="chat-icon-action" title="GIF">
                <GifIcon />
              </button>
              <button className="chat-icon-action" title="Voice">
                <MicIcon />
              </button>

              <input
                ref={inputRef}
                className="chat-input"
                placeholder="Message..."
                value={text}
                onChange={(e) => handleTypingChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {text.trim() ? (
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  title="Send"
                >
                  <SendIcon />
                </button>
              ) : (
                <button
                  className="chat-icon-action"
                  onClick={sendHeart}
                  title="Send heart"
                >
                  <HeartIcon />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}