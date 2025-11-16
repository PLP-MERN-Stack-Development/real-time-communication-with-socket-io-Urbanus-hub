// Test script to verify webhook setup
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/user.js";
import connectDb from "./config/db.js";

dotenv.config();

async function testWebhookSetup() {
  console.log("🧪 Testing Webhook Setup...\n");

  // 1. Check environment variables
  console.log("1️⃣ Checking Environment Variables:");
  console.log(
    `   CLERK_WEBHOOK_SECRET: ${
      process.env.CLERK_WEBHOOK_SECRET ? "✅ Set" : "❌ NOT SET"
    }`
  );
  console.log(`   PORT: ${process.env.PORT || 3000}`);
  console.log(
    `   MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Set" : "❌ NOT SET"}\n`
  );

  // 2. Check MongoDB connection
  console.log("2️⃣ Checking MongoDB Connection:");
  try {
    await connectDb();
    console.log("   ✅ Connected to MongoDB\n");
  } catch (error) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}\n`);
    process.exit(1);
  }

  // 3. Check users in database
  console.log("3️⃣ Checking Users in Database:");
  try {
    const userCount = await User.countDocuments();
    console.log(`   Total users in MongoDB: ${userCount}`);

    if (userCount > 0) {
      const users = await User.find().limit(3);
      users.forEach((user) => {
        console.log(
          `   - ${user.username} (${user.email}) [clerkId: ${user.clerkId}]`
        );
      });
    } else {
      console.log("   ℹ️ No users found in MongoDB yet");
    }
  } catch (error) {
    console.log(`   ❌ Error checking users: ${error.message}`);
  }

  console.log("\n📋 WEBHOOK SETUP CHECKLIST:");
  console.log("   ☐ Go to https://dashboard.clerk.com");
  console.log("   ☐ Select your app");
  console.log('   ☐ Click "Webhooks" in left sidebar');
  console.log('   ☐ Click "Create" or edit existing endpoint');
  console.log(
    `   ☐ Set URL to: http://localhost:${
      process.env.PORT || 3000
    }/api/webhooks/clerk`
  );
  console.log("   ☐ Subscribe to: user.created, user.updated, user.deleted");
  console.log("   ☐ Copy the Signing Secret (starts with whsec_)");
  console.log("   ☐ Update .env with: CLERK_WEBHOOK_SECRET=whsec_...");
  console.log("   ☐ Restart server with: npm run dev");
  console.log("   ☐ Sign up a new user in the app");
  console.log("   ☐ Check server logs for webhook messages");
  console.log("   ☐ Query MongoDB: db.users.find()");

  process.exit(0);
}

testWebhookSetup();
