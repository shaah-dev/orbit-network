import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api.js";
import CommentBox from "./CommentBox.jsx";

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post?.likes || []);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post?.comments || []);
  const [showShare, setShowShare] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  if (!post || !post.author) return null;

  const liked = likes.some(
    (id) => id === user?._id || id?._id === user?._id
  );

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLikes(data.likes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted?.(post._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareClick = async () => {
    if (showShare) {
      setShowShare(false);
      return;
    }
    try {
      const { data } = await api.get("/chat/conversations");
      setConversations(data);
      setShowShare(true);
    } catch (err) {
      console.error(err);
    }
  };

  const shareToChat = async (conversationId) => {
    setSharing(true);
    try {
      const postLink = `${window.location.origin}/profile/${post.author.username}`;
      const message = post.text
        ? `📤 Shared a post: "${post.text.slice(0, 100)}${post.text.length > 100 ? "..." : ""}" — ${postLink}`
        : `📤 Shared a post — ${postLink}`;
      await api.post(`/chat/conversations/${conversationId}/messages`, {
        text: message,
      });
      setShared(true);
      setTimeout(() => {
        setShowShare(false);
        setShared(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  const timeAgo = (date) => {
    if (!date) return "";
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-head">
        <Link to={`/profile/${post.author.username}`}>
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              className="avatar"
              alt={post.author.name}
            />
          ) : (
            <div
              className="avatar"
              style={{
                background: "var(--surface-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              👤
            </div>
          )}
        </Link>
        <div className="meta">
          <Link to={`/profile/${post.author.username}`} className="name">
            {post.author.name}
          </Link>
          <span className="handle">
            @{post.author.username} ·{" "}
            <span className="time">{timeAgo(post.createdAt)}</span>
          </span>
        </div>
        {String(post.author._id) === String(user?._id) && (
          <button
            className="icon-btn"
            onClick={handleDelete}
            title="Delete"
            style={{ width: 30, height: 30, fontSize: 14, marginLeft: "auto" }}
          >
            🗑️
          </button>
        )}
      </div>

      {/* Text */}
      {post.text && <p className="post-text">{post.text}</p>}

      {/* Image */}
      {post.image && (
        <img src={post.image} className="post-image" alt="post" />
      )}

      {/* Video */}
      {post.video && (
        <video
          src={post.video}
          controls
          style={{
            width: "100%",
            borderRadius: "var(--radius-sm)",
            marginBottom: 14,
            maxHeight: 480,
            border: "1px solid var(--border)",
          }}
        />
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          {liked ? "❤️" : "🤍"}
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>
        <button
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {comments.length > 0 && <span>{comments.length}</span>}
        </button>
        <button className="action-btn" onClick={handleShareClick}>
          📤 {showShare ? "Close" : "Share"}
        </button>
      </div>

      {/* Share panel */}
      {showShare && (
        <div
          style={{
            marginTop: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: 12,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              color: "var(--text-dim)",
            }}
          >
            Share to conversation:
          </p>

          {shared && (
            <p style={{ fontSize: 13, color: "var(--primary)" }}>
              ✅ Shared successfully!
            </p>
          )}

          {!shared && conversations.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
              No conversations yet. Message someone first.
            </p>
          )}

          {!shared &&
            conversations.map((c) => {
              const other = c.participants?.find((p) => p._id !== user?._id);
              if (!other) return null;
              return (
                <div
                  key={c._id}
                  onClick={() => !sharing && shareToChat(c._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: sharing ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {other.avatar ? (
                    <img
                      src={other.avatar}
                      className="avatar avatar-xs"
                      alt=""
                    />
                  ) : (
                    <div
                      className="avatar avatar-xs"
                      style={{
                        background: "var(--surface-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                      }}
                    >
                      👤
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {other.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      @{other.username}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          <CommentBox
            post={{ ...post, comments }}
            onCommentAdded={(c) => setComments([...comments, c])}
          />
        </div>
      )}
    </div>
  );
}