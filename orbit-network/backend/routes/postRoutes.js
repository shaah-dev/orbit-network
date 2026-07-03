import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Create a post
router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text && !req.file) {
      return res.status(400).json({ message: "Post needs text or a media file" });
    }

    const isVideo = req.file && req.file.mimetype.startsWith("video/");

    const post = await Post.create({
      author: req.user._id,
      text: text || "",
      image: req.file && !isVideo ? req.file.path : "",
      video: req.file && isVideo ? req.file.path : "",
    });

    const populated = await post.populate("author", "name username avatar");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Feed: posts from people the user follows + own posts, newest first
router.get("/feed", protect, async (req, res) => {
  try {
    const ids = [...req.user.following, req.user._id];
    const posts = await Post.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username avatar" },
      });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Explore: all posts, newest first
router.get("/explore", protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("author", "name username avatar")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username avatar" },
      });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get posts by a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username avatar" },
      });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like / unlike a post
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some((id) => String(id) === String(req.user._id));
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => String(id) !== String(req.user._id));
    } else {
      post.likes.push(req.user._id);
      if (String(post.author) !== String(req.user._id)) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: "like",
          post: post._id,
        });
      }
    }
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a comment
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text,
    });
    post.comments.push(comment._id);
    await post.save();

    if (String(post.author) !== String(req.user._id)) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        post: post._id,
      });
    }

    const populated = await comment.populate("author", "name username avatar");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a post (only by its author)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
