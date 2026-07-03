import { useState } from "react";
import api from "../api.js";

export default function FollowButton({ targetId, isFollowing, onChange }) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (following) {
        await api.post(`/users/${targetId}/unfollow`);
      } else {
        await api.post(`/users/${targetId}/follow`);
      }
      setFollowing(!following);
      onChange?.(!following);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={following ? "btn btn-outline" : "btn btn-primary"}
      onClick={handleClick}
      disabled={loading}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
