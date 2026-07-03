import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api.js";
import PostCard from "../components/PostCard.jsx";

export default function Feed() {
  const { user } = useAuth();
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPosts = async (which) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/posts/${which === "feed" ? "feed" : "explore"}`
      );
      setPosts(data);
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(tab);
  }, [tab]);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith("video/"));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setIsVideo(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaFile) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("text", text);
      if (mediaFile) formData.append("media", mediaFile);
      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPosts([data, ...posts]);
      setText("");
      clearMedia();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Home</h2>

      {/* Composer */}
      <div className="composer">
        <div className="composer-top">
          {user?.avatar ? (
            <img src={user.avatar} className="avatar" alt={user.name} />
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
          <textarea
            placeholder="What's happening in your orbit?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
        </div>

        {/* Media preview */}
        {mediaPreview && (
          <div style={{ position: "relative", marginTop: 10 }}>
            {isVideo ? (
              <video
                src={mediaPreview}
                controls
                style={{
                  width: "100%",
                  maxHeight: 240,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              />
            ) : (
              <img
                src={mediaPreview}
                alt="preview"
                style={{
                  width: "100%",
                  maxHeight: 240,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              />
            )}
            <button
              onClick={clearMedia}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="composer-bottom">
          <div className="composer-actions">
            <label className="composer-action-btn" style={{ cursor: "pointer" }}>
              🖼️ Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleMediaSelect}
              />
            </label>
            <label className="composer-action-btn" style={{ cursor: "pointer" }}>
              🎥 Video
              <input
                type="file"
                accept="video/*"
                hidden
                onChange={handleMediaSelect}
              />
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="char-count">{text.length}/2000</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePost}
              disabled={posting || (!text.trim() && !mediaFile)}
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="feed-tabs">
        <button
          className={`feed-tab ${tab === "feed" ? "active" : ""}`}
          onClick={() => setTab("feed")}
        >
          Following
        </button>
        <button
          className={`feed-tab ${tab === "explore" ? "active" : ""}`}
          onClick={() => setTab("explore")}
        >
          Explore
        </button>
      </div>

      {loading && <div className="loading">Loading posts...</div>}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🌌</div>
          <p>
            {tab === "feed"
              ? "Nothing here yet. Follow people or share your first post."
              : "No posts yet. Be the first to post something!"}
          </p>
        </div>
      )}

      {!loading &&
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onDeleted={(id) => setPosts(posts.filter((p) => p._id !== id))}
          />
        ))}
    </div>
  );
}