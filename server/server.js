import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware, clerkClient } from "@clerk/express";

// Our custom files
import { verifyClerkToken, verifySocketAuth } from "./middlewares/clerkAuth.js";
import connectDb from "./config/db.js";
import User from "./models/user.js";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import { handleClerkWebhook } from "./webhooks/clerkEvents.js";

dotenv.config();

/**
 * CREATE EXPRESS APP
 */
const app = express();

/**
 * CREATE HTTP SERVER
 */
const server = http.createServer(app);

/**
 * CREATE SOCKET.IO SERVER
 */
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

/**
 * ==========================================
 * MIDDLEWARE SETUP
 * ==========================================
 * ORDER MATTERS! Each middleware processes the request in sequence
 */

// 1. CORS - Allow frontend to access backend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// 2. Raw Body Parser - MUST come before JSON parser for webhooks
// This captures the raw body for signature verification
app.use(express.raw({ type: 'application/json' }));

// 3. JSON Parser - Parse JSON request bodies
app.use(express.json());

// 4. URL-encoded Parser - Parse form data
app.use(express.urlencoded({ extended: true }));

// 4. CLERK MIDDLEWARE - Process authentication for ALL routes
// This MUST come before any routes that use getAuth()
app.use(clerkMiddleware());

/**
 * CONNECT TO DATABASE
 */
connectDb();

/**
 * ==========================================
 * SOCKET.IO AUTHENTICATION MIDDLEWARE
 * ==========================================
 */
io.use(verifySocketAuth);

/**
 * ==========================================
 * SOCKET.IO CONNECTION HANDLER
 * ==========================================
 */
io.on("connection", async (socket) => {
  console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

  try {
    // Find or create user in database
    let user = await User.findOne({ clerkId: socket.user.clerkId });

    if (!user) {
      user = await User.create({
        clerkId: socket.user.clerkId,
        username: socket.user.username,
        email: socket.user.email,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        imageUrl: socket.user.imageUrl,
        socketId: socket.id,
        isOnline: true,
      });
      console.log(`👤 New user created: ${user.username}`);
    } else {
      user.socketId = socket.id;
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
      console.log(`👤 User updated: ${user.username}`);
    }

    socket.userId = user._id;
    socket.join(`user:${user._id}`);

    // Broadcast user online status
    io.emit("user_status", {
      userId: user._id,
      username: user.username,
      isOnline: true,
    });

    // Send user's conversations
    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate("participants", "username imageUrl isOnline")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    socket.emit("conversations_list", conversations);

    /**
     * EVENT: join_conversation
     */
    socket.on("join_conversation", async (conversationId) => {
      socket.join(`conversation:${conversationId}`);

      const messages = await Message.find({ conversationId })
        .populate("sender", "username imageUrl")
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit("conversation_messages", messages);
    });

    /**
     * EVENT: send_message
     */
    socket.on(
      "send_message",
      async ({ conversationId, content, messageType = "text" }) => {
        try {
          const conversation = await Conversation.findById(conversationId);

          if (!conversation || !conversation.participants.includes(user._id)) {
            return socket.emit("error", { message: "Unauthorized" });
          }

          const message = await Message.create({
            conversationId,
            sender: user._id,
            content,
            messageType,
          });

          conversation.lastMessage = message._id;
          conversation.lastMessageAt = new Date();
          await conversation.save();

          await message.populate("sender", "username imageUrl");

          io.to(`conversation:${conversationId}`).emit(
            "receive_message",
            message
          );

          console.log(`💬 Message sent in conversation ${conversationId}`);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    /**
     * EVENT: typing
     */
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: user._id,
        username: user.username,
        isTyping,
      });
    });

    /**
     * EVENT: create_conversation
     */
    socket.on(
      "create_conversation",
      async ({ participantIds, isGroup, groupName }) => {
        try {
          const allParticipants = [...new Set([...participantIds, user._id])];

          if (!isGroup && allParticipants.length === 2) {
            const existing = await Conversation.findOne({
              isGroup: false,
              participants: { $all: allParticipants, $size: 2 },
            }).populate("participants", "username imageUrl isOnline");

            if (existing) {
              return socket.emit("conversation_created", existing);
            }
          }

          const conversation = await Conversation.create({
            participants: allParticipants,
            isGroup,
            groupName: isGroup ? groupName : null,
            createdBy: user._id,
          });

          await conversation.populate(
            "participants",
            "username imageUrl isOnline"
          );

          allParticipants.forEach((participantId) => {
            io.to(`user:${participantId}`).emit(
              "conversation_created",
              conversation
            );
          });

          console.log(`🆕 New conversation created: ${conversation._id}`);
        } catch (error) {
          console.error("Error creating conversation:", error);
          socket.emit("error", { message: "Failed to create conversation" });
        }
      }
    );

    /**
     * EVENT: mark_as_read
     */
    socket.on("mark_as_read", async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            "readBy.user": { $ne: user._id },
          },
          {
            $push: {
              readBy: {
                user: user._id,
                readAt: new Date(),
              },
            },
          }
        );

        io.to(`conversation:${conversationId}`).emit("messages_read", {
          userId: user._id,
          messageIds,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    /**
     * EVENT: disconnect
     */
    socket.on("disconnect", async () => {
      console.log(`❌ User disconnected: ${user.username}`);

      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();

      io.emit("user_status", {
        userId: user._id,
        username: user.username,
        isOnline: false,
        lastSeen: user.lastSeen,
      });
    });
  } catch (error) {
    console.error("Socket connection error:", error);
    socket.disconnect();
  }
});

/**
 * ==========================================
 * REST API ROUTES
 * ==========================================
 */

/**
 * POST /api/webhooks/clerk
 * Webhook endpoint for Clerk events (user signup, update, delete)
 * This endpoint receives events from Clerk when users sign up or update their profile
 */
app.post("/api/webhooks/clerk", handleClerkWebhook);

/**
 * GET /api/users
 * Get list of all users except current user
 */
app.get("/api/users", verifyClerkToken, async (req, res) => {
  try {
    const users = await User.find({
      clerkId: { $ne: req.user.clerkId },
    }).select("username email imageUrl isOnline lastSeen");

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * GET /api/conversations
 * Get all conversations for current user
 */
app.get("/api/conversations", verifyClerkToken, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.user.clerkId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate("participants", "username imageUrl isOnline lastSeen")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * GET /api/conversations/:conversationId/messages
 * Get messages for a specific conversation
 */
app.get(
  "/api/conversations/:conversationId/messages",
  verifyClerkToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { limit = 50, before } = req.query;

      const user = await User.findOne({ clerkId: req.user.clerkId });

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(user._id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const query = { conversationId };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .populate("sender", "username imageUrl")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.json(messages.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

/**
 * GET /api/users/search
 * Search for users by username/email/name
 */
app.get("/api/users/search", verifyClerkToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query required" });
    }

    const users = await User.find({
      clerkId: { $ne: req.user.clerkId },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
      ],
    })
      .select("username email imageUrl isOnline")
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

/**
 * GET /user
 * Get current authenticated user (example from Clerk docs)
 */
app.get("/user", verifyClerkToken, async (req, res) => {
  res.json(req.user);
});

/**
 * GET / (root route)
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Chat API Server",
    timestamp: new Date().toISOString(),
  });
});

/**
 * ERROR HANDLING MIDDLEWARE
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

/**
 * ==========================================
 * START SERVER
 * ==========================================
 */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀================================🚀");
  console.log(`   Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log("🚀================================🚀");
});

/**
 * ==========================================
 * KEY CHANGES WITH NEW CLERK SDK:
 * ==========================================
 *
 * 1. GLOBAL MIDDLEWARE:
 *    app.use(clerkMiddleware())
 *    - Processes ALL requests automatically
 *    - Extracts session from cookies/headers
 *    - Makes authentication info available to all routes
 *
 * 2. SIMPLER AUTH CHECK:
 *    OLD: Manual token verification in middleware
 *    NEW: Just use getAuth(req) to get userId
 *
 * 3. BETTER PERFORMANCE:
 *    - Session verified once by clerkMiddleware()
 *    - Not repeated for each protected route
 *    - Reduces API calls to Clerk
 *
 * 4. CLEANER CODE:
 *    - No manual header parsing
 *    - No complex token verification logic
 *    - Clerk SDK handles everything
 *
 * 5. AUTOMATIC COOKIE HANDLING:
 *    - Works with session cookies
 *    - Works with Bearer tokens
 *    - Clerk decides best method automatically
 */
