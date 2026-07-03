import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, adminOnly);

// Dashboard stats
router.get("/stats", async (req, res) => {
  const [users, posts, comments, notifications] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Notification.countDocuments(),
  ]);
  res.json({ users, posts, comments, notifications });
});

// All users
router.get("/users", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// Activate / deactivate a user
router.put("/users/:id/toggle-active", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.isActive = !user.isActive;
  await user.save();
  res.json(user.toSafeObject());
});

// Promote / demote admin
router.put("/users/:id/toggle-role", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.role = user.role === "admin" ? "user" : "admin";
  await user.save();
  res.json(user.toSafeObject());
});

// Delete a user entirely
router.delete("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await Post.deleteMany({ author: user._id });
  await Comment.deleteMany({ author: user._id });
  await Notification.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] });
  await user.deleteOne();
  res.json({ message: "User and related content deleted" });
});

// All posts (moderation)
router.get("/posts", async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("author", "name username avatar");
  res.json(posts);
});

// Delete any post
router.delete("/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ message: "Post deleted" });
});

export default router;
