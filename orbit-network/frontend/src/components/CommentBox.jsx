import { useState } from "react";
import api from "../api.js";

export default function CommentBox({ post, onCommentAdded }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text });
      onCommentAdded(data);
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const safeComments = Array.isArray(post?.comments) ? post.comments : [];

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {safeComments.map((c) => {
          if (!c || !c._id) return null;
          return (
            <div className="comment-item" key={c._id}>
              {c.author?.avatar ? (
                <img
                  src={c.author.avatar}
                  className="avatar avatar-sm"
                  alt=""
                />
              ) : (
                <div
                  className="avatar avatar-sm"
                  style={{
                    background: "var(--surface-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  👤
                </div>
              )}
              <div className="comment-bubble">
                <span className="author">{c.author?.name || "User"}</span>
                {c.text}
              </div>
            </div>
          );
        })}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" disabled={submitting}>
          {submitting ? "..." : "Post"}
        </button>
      </form>
    </div>
  );
}