// ============================================
// middleware/clerkAuth.js (UPDATED)
// ============================================
// This file handles authentication using Clerk Express SDK
// Using the newer, simpler Clerk Express methods

import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/express';

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
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get full user details from Clerk using the userId
    const user = await clerkClient.users.getUser(userId);
    
    // Attach user information to the request object
    // Now any route using this middleware can access req.user
    req.user = {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0],
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      sessionId: sessionId
    };

    // Continue to the next middleware or route handler
    next();
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};


/**
 * MIDDLEWARE FOR SOCKET.IO CONNECTIONS
 * This checks if a WebSocket connection is authenticated
 * 
 * Socket.io connections work differently - we need to manually
 * verify the session token during the handshake
 */
export const verifySocketAuth = async (socket, next) => {
  try {
    // Get the session token from socket handshake
    const sessionToken = socket.handshake.auth.token;
    
    if (!sessionToken) {
      return next(new Error('No authentication token provided'));
    }

    // Verify the session token with Clerk
    // This returns the session object if valid
    const session = await clerkClient.sessions.verifyToken(sessionToken, {
      jwtKey: process.env.CLERK_JWT_KEY
    });

    if (!session || !session.userId) {
      return next(new Error('Invalid session'));
    }

    // Get full user details
    const user = await clerkClient.users.getUser(session.userId);
    
    // Attach user info to the socket object
    socket.user = {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0],
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      sessionId: session.id
    };

    // Allow the connection
    next();
    
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'));
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