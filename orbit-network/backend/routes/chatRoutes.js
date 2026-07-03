import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all my conversations, newest activity first
router.get("/conversations", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name username avatar");
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start a conversation with another user, or return the existing one
router.post("/conversations", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (userId === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate("participants", "name username avatar");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      conversation = await conversation.populate("participants", "name username avatar");
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages in a conversation
router.get("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "Not part of this conversation" });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "name username avatar");

    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.user._id }, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message (also emits over socket.io from server.js via req.app.get("io"))
router.post("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Message text is required" });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "Not part of this conversation" });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
    });
    const populated = await message.populate("sender", "name username avatar");

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p}`).emit("new_message", {
          conversationId: conversation._id,
          message: populated,
        });
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
