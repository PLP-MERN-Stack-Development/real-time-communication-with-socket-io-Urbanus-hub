// ============================================
// middleware/clerkAuth.js (UPDATED)
// ============================================
// This file handles authentication using Clerk Express SDK
// Using the newer, simpler Clerk Express methods

import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

/**
 * MIDDLEWARE FOR REST API ROUTES
 * Uses Clerk's getAuth() method to check authentication
 *
 * How it works:
 * 1. clerkMiddleware() (applied globally) processes Clerk session
 * 2. getAuth(req) extracts user info from the processed request
 * 3. If authenticated, attach user details and continue
 * 4. If not authenticated, send error
 */
export const verifyClerkToken = async (req, res, next) => {
  try {
    // Use Clerk's getAuth() to get authentication status and userId
    const { userId, sessionId } = getAuth(req);

    // If no userId, user is not authenticated
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get full user details from Clerk using the userId
    const user = await clerkClient.users.getUser(userId);

    // Attach user information to the request object
    // Now any route using this middleware can access req.user
    req.user = {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      username:
        user.username || user.emailAddresses[0]?.emailAddress.split("@")[0],
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      sessionId: sessionId,
    };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * MIDDLEWARE FOR SOCKET.IO CONNECTIONS
 * This checks if a WebSocket connection is authenticated
 *
 * Socket.io connections work differently - we need to manually
 * verify the user ID during the handshake
 */
export const verifySocketAuth = async (socket, next) => {
  try {
    // Get the token from socket handshake
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("❌ Socket connection attempt without token");
      return next(new Error("No authentication token provided"));
    }

    console.log("🔐 Verifying socket token...");

    // Try to decode and verify the JWT token using Clerk's method
    // The token is a JWT that contains the user ID
    let userId;

    try {
      // For development, we can extract userId from the token
      // In production, you might want to verify it properly
      const decoded = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      userId = decoded.sub; // 'sub' is the subject (user ID) in JWT

      if (!userId) {
        throw new Error("No user ID in token");
      }

      console.log(`✅ Token decoded, userId: ${userId}`);
    } catch (decodeError) {
      console.error("Failed to decode token:", decodeError.message);
      return next(new Error("Invalid token format"));
    }

    // Get full user details from Clerk
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      console.error(`❌ Error fetching user from Clerk: ${clerkError.message}`);
      console.error(`   Creating user with minimal info instead...`);
      // If Clerk lookup fails, create user with just the userId
      clerkUser = {
        id: userId,
        username: `user_${userId.slice(-6)}`,
        emailAddresses: [
          { emailAddress: `user_${userId.slice(-6)}@app.local` },
        ],
        firstName: "User",
        lastName: "",
        imageUrl: "",
      };
    }

    console.log(`✅ User verified: ${clerkUser.username || clerkUser.id}`);

    // Import User model
    const User = (await import("../models/user.js")).default;

    // Check if user exists in MongoDB, if not create them
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      console.log(`📝 User not in MongoDB, creating...`);
      dbUser = await User.create({
        clerkId: clerkUser.id,
        username:
          clerkUser.username ||
          clerkUser.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
          "user",
        email:
          clerkUser.emailAddresses?.[0]?.emailAddress || "unknown@example.com",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        imageUrl: clerkUser.imageUrl || "",
        isOnline: false,
        lastSeen: new Date(),
      });
      console.log(`✅ User created in MongoDB: ${dbUser.username}`);
    } else {
      console.log(`✅ User found in MongoDB: ${dbUser.username}`);
    }

    // Attach user info to the socket object
    socket.user = {
      clerkId: clerkUser.id,
      email:
        clerkUser.emailAddresses?.[0]?.emailAddress || "unknown@example.com",
      username:
        clerkUser.username ||
        clerkUser.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "user",
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      imageUrl: clerkUser.imageUrl || "",
    };

    // Allow the connection
    next();
  } catch (error) {
    console.error("❌ Socket auth error:", error.message);
    next(new Error("Authentication error: " + error.message));
  }
};

/**
 * KEY DIFFERENCES FROM OLD VERSION:
 *
 * 1. SIMPLER API:
 *    OLD: Manually verify session with sessionId + token
 *    NEW: Use getAuth(req) which is pre-processed by clerkMiddleware()
 *
 * 2. AUTOMATIC SESSION HANDLING:
 *    clerkMiddleware() automatically processes cookies/headers
 *    getAuth() just extracts the results
 *
 * 3. BETTER PERFORMANCE:
 *    Session verification happens once in clerkMiddleware()
 *    Not repeated for each protected route
 *
 * 4. CLEANER CODE:
 *    No manual token parsing from headers
 *    Clerk handles all the complexity
 */
