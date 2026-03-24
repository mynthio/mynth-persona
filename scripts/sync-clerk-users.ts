#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig } from "@neondatabase/serverless";
import { users, userTokens } from "../src/db/schema";

// Load environment variables
config({ path: [".env.local", ".env"], quiet: true });

neonConfig.wsProxy = (host) => `${host}:5443/v1`;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

// Initialize database connection
export const db = drizzle(process.env.LOCAL_DATABASE_URL!);

// DRY RUN MODE - Set to true to see what would be synced without actually doing it
const DRY_RUN = true;

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
}

async function fetchClerkUsers(): Promise<ClerkUser[]> {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not set in environment variables");
  }

  console.log("🔍 Starting to fetch users from Clerk API...");
  console.log(`📡 API Endpoint: https://api.clerk.com/v1/users`);
  console.log(`🔑 Using secret key: ${secretKey.substring(0, 10)}...`);

  const allUsers: ClerkUser[] = [];
  let offset = 0;
  const limit = 500; // Clerk's max limit per request

  while (true) {
    console.log(`\n📥 Fetching batch with offset ${offset}, limit ${limit}...`);

    const response = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      `📡 Response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorText = await response.text.text();
      console.error(`❌ API Error Response:`, errorText);
      throw new Error(
        `Failed to fetch users from Clerk: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`📊 Received ${data?.length || 0} users in this batch`);

    if (!data || !Array.isArray(data)) {
      console.log("🏁 No more users to fetch (empty response)");
      break; // No more users
    }

    allUsers.push(...data);
    console.log(`📈 Total users collected so far: ${allUsers.length}`);

    // If we got fewer users than the limit, we've reached the end
    if (data.length < limit) {
      console.log("🏁 Reached end of user list (batch smaller than limit)");
      break;
    }

    offset += limit;
  }

  console.log(
    `\n✅ Successfully fetched ${allUsers.length} total users from Clerk`,
  );
  return allUsers;
}

async function syncUsersToDatabase(clerkUsers: ClerkUser[]) {
  console.log("\n🗄️  Starting database sync analysis...");

  if (DRY_RUN) {
    console.log("🧪 DRY RUN MODE: No actual database changes will be made");
  }

  // Get existing users from database
  console.log("📊 Querying existing users from database...");
  const existingUsers = await db.select({ id: users.id }).from(users);
  const existingUserIds = new Set(existingUsers.map((u) => u.id));

  console.log(`📈 Found ${existingUsers.length} existing users in database`);
  console.log(
    "🔍 Existing user IDs:",
    Array.from(existingUserIds).slice(0, 5),
    existingUserIds.size > 5 ? "..." : "",
  );

  let newUsersCount = 0;
  let skippedUsersCount = 0;
  const newUsersToAdd: ClerkUser[] = [];
  const skippedUsers: ClerkUser[] = [];

  console.log(`\n🔄 Analyzing ${clerkUsers.length} Clerk users...`);

  for (let i = 0; i < clerkUsers.length; i++) {
    const clerkUser = clerkUsers[i];
    const email = clerkUser.email_addresses[0]?.email_address || "No email";
    const name =
      [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
      "No name";
    const createdDate = new Date(clerkUser.created_at).toISOString();
    const updatedDate = new Date(clerkUser.updated_at).toISOString();

    console.log(`\n👤 User ${i + 1}/${clerkUsers.length}:`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   👋 Name: ${name}`);
    console.log(`   🆔 Clerk ID: ${clerkUser.id}`);
    console.log(`   📅 Created: ${createdDate}`);
    console.log(`   🔄 Updated: ${updatedDate}`);
    console.log(`   📝 First Name: ${clerkUser.first_name || "null"}`);
    console.log(`   📝 Last Name: ${clerkUser.last_name || "null"}`);
    console.log(`   📧 Email Objects:`, clerkUser.email_addresses.length);

    if (existingUserIds.has(clerkUser.id)) {
      console.log(`   ⏭️  Status: SKIP (already exists in database)`);
      skippedUsersCount++;
      skippedUsers.push(clerkUser);
      continue;
    }

    console.log(`   ✨ Status: NEW (will be added to database)`);
    newUsersCount++;
    newUsersToAdd.push(clerkUser);

    // Show what would be inserted
    console.log(`   📋 User record to insert:`);
    console.log(`      - id: ${clerkUser.id}`);
    console.log(`      - createdAt: ${createdDate}`);
    console.log(`      - updatedAt: ${updatedDate}`);

    console.log(`   🎫 Token record to insert:`);
    console.log(`      - userId: ${clerkUser.id}`);
    console.log(`      - balance: 1000`);
    console.log(`      - dailyTokens: 100`);
    console.log(`      - lastDailyGrant: ${new Date().toISOString()}`);
    console.log(`      - totalPurchased: 0`);
    console.log(`      - totalSpent: 0`);
  }

  console.log("\n📊 Analysis Summary:");
  console.log(`• New users to add: ${newUsersCount}`);
  console.log(`• Existing users to skip: ${skippedUsersCount}`);
  console.log(`• Total Clerk users analyzed: ${clerkUsers.length}`);
  console.log(`• Current database users: ${existingUsers.length}`);
  console.log(
    `• Database users after sync: ${existingUsers.length + newUsersCount}`,
  );

  if (DRY_RUN) {
    console.log("\n🧪 DRY RUN COMPLETE - No changes made to database");
    console.log(
      "💡 To actually sync the users, set DRY_RUN = false in the script",
    );
    return;
  }

  // If not dry run, proceed with actual insertion
  console.log("\n💾 Proceeding with actual database insertion...");

  for (let i = 0; i < newUsersToAdd.length; i++) {
    const clerkUser = newUsersToAdd[i];
    const email = clerkUser.email_addresses[0]?.email_address || "No email";
    const name =
      [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
      "No name";

    try {
      console.log(
        `\n💾 Inserting user ${i + 1}/${
          newUsersToAdd.length
        }: ${name} (${email})`,
      );

      // Insert new user
      await db.insert(users).values({
        id: clerkUser.id,
        createdAt: new Date(clerkUser.created_at),
        updatedAt: new Date(clerkUser.updated_at),
      });
      console.log(`   ✅ User record inserted`);

      // Initialize user tokens with default values
      await db.insert(userTokens).values({
        userId: clerkUser.id,
        balance: 0, // Give new users 1000 tokens to start
        dailyTokensUsed: 0, // Daily token allowance
        lastDailyReset: new Date(),
        totalPurchased: 0,
        totalSpent: 0,
        updatedAt: new Date(),
      });
      console.log(`   🎫 Token record inserted`);

      console.log(
        `   🎉 Successfully added: ${name} (${email}) - ID: ${clerkUser.id}`,
      );
    } catch (error) {
      console.error(`   ❌ Failed to add user ${clerkUser.id}:`, error);
    }
  }

  console.log("\n🎊 Database sync completed!");
}

async function main() {
  try {
    console.log("🚀 Starting Clerk to Database user sync...\n");

    if (DRY_RUN) {
      console.log("🧪 DRY RUN MODE ENABLED - No database changes will be made");
      console.log("💡 This will show you exactly what would be synced\n");
    }

    // Verify environment variables
    console.log("🔧 Checking environment variables...");
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }
    console.log("✅ DATABASE_URL is set");

    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error("CLERK_SECRET_KEY is not set in environment variables");
    }
    console.log("✅ CLERK_SECRET_KEY is set");
    console.log(
      `🔑 Database URL: ${process.env.DATABASE_URL.substring(0, 20)}...`,
    );

    // Fetch users from Clerk
    const clerkUsers = await fetchClerkUsers();

    if (clerkUsers.length === 0) {
      console.log("❌ No users found in Clerk. Nothing to sync.");
      return;
    }

    // Log some sample users for verification
    console.log("\n📋 Sample of fetched users:");
    const sampleUsers = clerkUsers.slice(0, 3);
    sampleUsers.forEach((user, index) => {
      const email = user.email_addresses[0]?.email_address || "No email";
      const name =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        "No name";
      console.log(`   ${index + 1}. ${name} (${email}) - ID: ${user.id}`);
    });
    if (clerkUsers.length > 3) {
      console.log(`   ... and ${clerkUsers.length - 3} more users`);
    }

    // Sync to database
    await syncUsersToDatabase(clerkUsers);

    if (DRY_RUN) {
      console.log("\n🧪 DRY RUN COMPLETED - Review the output above");
      console.log("💡 To actually perform the sync, change DRY_RUN to false");
    } else {
      console.log("\n✅ Sync completed successfully!");
    }
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    if (error instanceof Error) {
      console.error("📜 Error details:", error.message);
      console.error("📍 Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Unhandled error:", error);
      process.exit(1);
    });
}
