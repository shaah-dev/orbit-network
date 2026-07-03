import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import FollowButton from "../components/FollowButton.jsx";
import PostCard from "../components/PostCard.jsx";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");

  const isOwnProfile = user?.username === username;

  const load = async () => {
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data);
      setBio(data.bio || "");
      setName(data.name || "");
      const postsRes = await api.get(`/posts/user/${data._id}`);
      setPosts(postsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [username]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.put("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser(data);
    load();
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("cover", file);
    await api.put("/users/me/cover", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    load();
  };

  const saveProfile = async () => {
    const { data } = await api.put("/users/me", { name, bio });
    setUser(data);
    setEditing(false);
    load();
  };

  const startConversation = async () => {
    const { data } = await api.post("/chat/conversations", {
      userId: profile._id,
    });
    navigate(`/chat/${data._id}`);
  };

  if (!profile)
    return <div className="loading">Loading profile...</div>;

  const isFollowing = profile.followers?.some(
    (f) => f._id === user?._id || f === user?._id
  );

  return (
    <div>
      {/* Cover */}
      <div
        className="profile-cover"
        style={
          profile.coverImage
            ? {
                backgroundImage: `url(${profile.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : {}
        }
      >
        <div className="profile-avatar-wrap">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              className="avatar"
              alt={profile.name}
              style={{ width: 88, height: 88, border: "3px solid var(--bg)" }}
            />
          ) : (
            <div
              className="avatar"
              style={{
                width: 88,
                height: 88,
                border: "3px solid var(--bg)",
                background: "var(--surface-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              👤
            </div>
          )}
        </div>

        {isOwnProfile && (
          <label
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              cursor: "pointer",
              zIndex: 5,
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🖼️ Change Cover
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleCoverChange}
            />
          </label>
        )}
      </div>

      {/* Profile info row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          {editing ? (
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginBottom: 8, fontWeight: 700, fontSize: 20 }}
            />
          ) : (
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{profile.name}</h2>
          )}
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
            @{profile.username}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isOwnProfile ? (
            editing ? (
              <button className="btn btn-primary btn-sm" onClick={saveProfile}>
                Save
              </button>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditing(true)}
              >
                Edit profile
              </button>
            )
          ) : (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={startConversation}
              >
                Message
              </button>
              <FollowButton
                targetId={profile._id}
                isFollowing={isFollowing}
                onChange={load}
              />
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      {editing ? (
        <textarea
          className="input"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write your bio..."
          style={{ marginBottom: 12 }}
        />
      ) : (
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12, color: "var(--text-dim)" }}>
          {profile.bio || "No bio yet."}
        </p>
      )}

      {/* Change avatar button (only while editing) */}
      {isOwnProfile && editing && (
        <label
          className="btn btn-ghost btn-sm"
          style={{ display: "inline-flex", marginBottom: 16, cursor: "pointer" }}
        >
          📷 Change Avatar
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </label>
      )}

      {/* Stats */}
      <div className="profile-stats" style={{ marginBottom: 24 }}>
        <div className="stat">
          <span className="stat-num">{profile.followers?.length || 0}</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat">
          <span className="stat-num">{profile.following?.length || 0}</span>
          <span className="stat-label">Following</span>
        </div>
        <div className="stat">
          <span className="stat-num">{posts.length}</span>
          <span className="stat-label">Posts</span>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No posts yet.</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post._id} post={post} onDeleted={() => load()} />
      ))}
    </div>
  );
}