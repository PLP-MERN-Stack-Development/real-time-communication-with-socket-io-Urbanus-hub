// ============================================
// webhooks/clerkEvents.js
// ============================================
// This file handles Clerk webhook events
// When a user signs up, updates profile, or deletes account,
// Clerk sends a webhook to our server and we update MongoDB

import { Webhook } from "svix";
import User from "../models/user.js";

/**
 * WEBHOOK HANDLER FOR CLERK EVENTS
 *
 * Supported events:
 * - user.created: New user signed up
 * - user.updated: User profile updated
 * - user.deleted: User deleted their account
 */
export const handleClerkWebhook = async (req, res) => {
  try {
    // Get the webhook signing secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ CLERK_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Create a Svix instance for signature verification
    const wh = new Webhook(webhookSecret);

    // Get the raw body as a string (important for signature verification)
    // req.body is a Buffer when using express.raw(), so we need to convert it to string
    const payload = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : JSON.stringify(req.body);
    const headers = req.headers;

    console.log(`📨 Webhook request received`);
    console.log(`   Headers:`, Object.keys(headers));

    // Verify the webhook signature
    // This ensures the event is genuinely from Clerk
    let evt;
    try {
      evt = wh.verify(payload, headers);
      console.log(`✅ Webhook signature verified successfully`);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Webhook verification failed" });
    }

    // Extract event type and data
    const eventType = evt.type;
    const eventData = evt.data;

    console.log(`🔔 Webhook received: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case "user.created":
        await handleUserCreated(eventData);
        break;

      case "user.updated":
        await handleUserUpdated(eventData);
        break;

      case "user.deleted":
        await handleUserDeleted(eventData);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
    }

    // Send success response
    res.status(200).json({ success: true, message: `Processed ${eventType}` });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * HANDLE USER.CREATED EVENT
 * When a new user signs up, create them in MongoDB
 */
async function handleUserCreated(userData) {
  try {
    const { id, username, email_addresses, first_name, last_name, image_url } =
      userData;

    // Get the primary email
    const primaryEmail =
      email_addresses?.find((e) => e.primary)?.email_address ||
      email_addresses?.[0]?.email_address ||
      "unknown";

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      console.log(`✅ User already exists: ${existingUser.username}`);
      return;
    }

    // Create new user in MongoDB
    const newUser = await User.create({
      clerkId: id,
      username: username || primaryEmail.split("@")[0],
      email: primaryEmail,
      firstName: first_name || "",
      lastName: last_name || "",
      imageUrl: image_url || "",
      isOnline: false,
      lastSeen: new Date(),
    });

    console.log(`✅ User created in MongoDB: ${newUser.username}`);
  } catch (error) {
    console.error("❌ Error handling user.created:", error);
    throw error;
  }
}

/**
 * HANDLE USER.UPDATED EVENT
 * When a user updates their profile, update them in MongoDB
 */
async function handleUserUpdated(userData) {
  try {
    const { id, username, email_addresses, first_name, last_name, image_url } =
      userData;

    // Get the primary email
    const primaryEmail =
      email_addresses?.find((e) => e.primary)?.email_address ||
      email_addresses?.[0]?.email_address;

    // Find and update user
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: id },
      {
        username: username || undefined,
        email: primaryEmail || undefined,
        firstName: first_name || "",
        lastName: last_name || "",
        imageUrl: image_url || "",
      },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`⚠️ User not found for update: ${id}`);
      return;
    }

    console.log(`✅ User updated in MongoDB: ${updatedUser.username}`);
  } catch (error) {
    console.error("❌ Error handling user.updated:", error);
    throw error;
  }
}

/**
 * HANDLE USER.DELETED EVENT
 * When a user deletes their account, remove them from MongoDB
 */
async function handleUserDeleted(userData) {
  try {
    const { id } = userData;

    // Find and delete the user
    const deletedUser = await User.findOneAndDelete({ clerkId: id });

    if (!deletedUser) {
      console.warn(`⚠️ User not found for deletion: ${id}`);
      return;
    }

    console.log(`✅ User deleted from MongoDB: ${deletedUser.username}`);
  } catch (error) {
    console.error("❌ Error handling user.deleted:", error);
    throw error;
  }
}

export default handleClerkWebhook;
