import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
        setResults(data);
        setOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (username) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/profile/${username}`);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", margin: "0 0 16px 0" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "9px 13px",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...(open ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--primary-glow)" } : {}),
      }}>
        <span style={{ fontSize: 15, color: "var(--text-muted)", flexShrink: 0 }}>🔍</span>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search people..."
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13.5,
            color: "var(--text)",
            fontFamily: "inherit",
            width: "100%",
          }}
        />
        {loading && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>...</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--surface)",
          border: "1px solid var(--border-hover)",
          borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          {results.map((user) => (
            <div
              key={user._id}
              onClick={() => handleSelect(user.username)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {user.avatar
                ? <img src={user.avatar} className="avatar avatar-sm" alt={user.name} />
                : <div className="avatar avatar-sm" style={{ background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
              }
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && !loading && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--surface)",
          border: "1px solid var(--border-hover)",
          borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          zIndex: 9999,
          padding: "14px 16px",
          fontSize: 13,
          color: "var(--text-dim)",
          textAlign: "center",
        }}>
          No users found for "{query}"
        </div>
      )}
    </div>
  );
}