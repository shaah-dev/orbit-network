import express from "express";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get current logged-in user
router.get("/me", protect, async (req, res) => {
  res.json(req.user.toSafeObject());
});

// Search users — MUST be before /:username route
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: q.trim(), $options: "i" } },
        { name: { $regex: q.trim(), $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    })
      .limit(8)
      .select("name username avatar bio");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a profile by username
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate("followers", "name username avatar")
      .populate("following", "name username avatar");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile (bio, name)
router.put("/me", protect, async (req, res) => {
  try {
    const { name, bio } = req.body;
    if (name !== undefined) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    await req.user.save();
    res.json(req.user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload avatar
router.put("/me/avatar", protect, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  req.user.avatar = req.file.path;
  await req.user.save();
  res.json(req.user.toSafeObject());
});

// Upload cover image
router.put("/me/cover", protect, upload.single("cover"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  req.user.coverImage = req.file.path;
  await req.user.save();
  res.json(req.user.toSafeObject());
});

// Follow a user
router.post("/:id/follow", protect, async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.followers.includes(req.user._id)) {
      return res.status(400).json({ message: "Already following" });
    }
    target.followers.push(req.user._id);
    req.user.following.push(target._id);
    await target.save();
    await req.user.save();

    await Notification.create({
      recipient: target._id,
      sender: req.user._id,
      type: "follow",
    });

    res.json({ message: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unfollow a user
router.post("/:id/unfollow", protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    target.followers = target.followers.filter(
      (id) => String(id) !== String(req.user._id)
    );
    req.user.following = req.user.following.filter(
      (id) => String(id) !== String(target._id)
    );
    await target.save();
    await req.user.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;