import { useEffect, useState } from "react";
import api from "../api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  const loadStats = async () => setStats((await api.get("/admin/stats")).data);
  const loadUsers = async () => setUsers((await api.get("/admin/users")).data);
  const loadPosts = async () => setPosts((await api.get("/admin/posts")).data);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "posts") loadPosts();
  }, [tab]);

  const toggleActive = async (id) => {
    await api.put(`/admin/users/${id}/toggle-active`);
    loadUsers();
  };

  const toggleRole = async (id) => {
    await api.put(`/admin/users/${id}/toggle-role`);
    loadUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user and all their content?")) return;
    await api.delete(`/admin/users/${id}`);
    loadUsers();
    loadStats();
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    await api.delete(`/admin/posts/${id}`);
    loadPosts();
    loadStats();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Admin Dashboard</h2>

      {stats && (
        <div className="admin-grid">
          <div className="stat-card"><div className="num">{stats.users}</div><div className="label">Users</div></div>
          <div className="stat-card"><div className="num">{stats.posts}</div><div className="label">Posts</div></div>
          <div className="stat-card"><div className="num">{stats.comments}</div><div className="label">Comments</div></div>
          <div className="stat-card"><div className="num">{stats.notifications}</div><div className="label">Notifications</div></div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Users</button>
        <button className={`tab-btn ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>Posts</button>
      </div>

      {tab === "users" && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>@{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.isActive ? "Active" : "Deactivated"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline" onClick={() => toggleActive(u._id)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-outline" onClick={() => toggleRole(u._id)}>
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteUser(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "posts" && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr><th>Author</th><th>Text</th><th>Likes</th><th>Comments</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p._id}>
                  <td>@{p.author?.username}</td>
                  <td>{p.text?.slice(0, 60)}</td>
                  <td>{p.likes?.length || 0}</td>
                  <td>{p.comments?.length || 0}</td>
                  <td><button className="btn btn-danger" onClick={() => deletePost(p._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
