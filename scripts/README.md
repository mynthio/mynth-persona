# Scripts Directory

This directory contains standalone utility scripts for the Mynth Persona application.

## 📋 Available Scripts

### 🔄 Clerk User Sync (`sync-clerk-users.ts`)

A standalone script to synchronize users from Clerk authentication service with your local database using Drizzle ORM.

#### 🎯 Purpose

This script fetches all existing users from your Clerk organization and creates corresponding user records in your local database. It's designed to:

- Sync existing Clerk users to your database
- Initialize user token balances for new users
- Avoid duplicate entries
- Provide comprehensive logging and dry-run capabilities

#### 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables** in `.env.local`:

   ```env
   DATABASE_URL=your_postgresql_database_url
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

3. **Run in dry-run mode first** (recommended):

   ```bash
   pnpm run sync-users
   ```

4. **Enable actual sync** by changing `DRY_RUN = false` in the script, then run:
   ```bash
   pnpm run sync-users
   ```

#### 🔧 Configuration

##### Dry Run Mode

- **Location:** Top of `sync-clerk-users.ts`
- **Default:** `DRY_RUN = true`
- **Purpose:** Allows you to see exactly what would be synced without making database changes

##### Token Initialization

When creating new users, the script automatically sets up:

- **Starting Balance:** 1,000 tokens
- **Daily Allowance:** 100 tokens
- **Daily Grant Date:** Current timestamp
- **Purchase/Spend History:** Initialized to 0

#### 📊 What the Script Does

1. **Environment Validation**
   - Checks for required environment variables
   - Validates database and Clerk API connectivity

2. **Clerk API Integration**
   - Fetches all users from your Clerk organization
   - Handles pagination automatically (500 users per request)
   - Provides detailed API response logging

3. **Database Analysis**
   - Queries existing users in your database
   - Identifies new users that need to be added
   - Shows exactly what would be inserted

4. **User Synchronization** (when not in dry-run)
   - Creates user records in the `users` table
   - Initializes token balances in the `userTokens` table
   - Maintains referential integrity

#### 📝 Detailed Logging

The script provides comprehensive logging for every operation:

##### API Operations

- Clerk API endpoint and authentication status
- Request/response details for each batch
- Pagination progress and total user count

##### User Analysis

For each user, logs:

- **Basic Info:** Name, email, Clerk ID
- **Timestamps:** Created/updated dates
- **Database Status:** New user or existing (skip)
- **Records to Insert:** Exact values for both tables

##### Database Operations

- Existing user count and sample IDs
- Step-by-step insertion progress
- Success/failure status for each operation
- Final summary statistics

#### 🗄️ Database Schema Integration

The script works with these database tables:

##### `users` table

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,     -- Clerk user ID
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

##### `userTokens` table

```sql
CREATE TABLE user_tokens (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
  balance INTEGER NOT NULL DEFAULT 0,
  daily_tokens INTEGER NOT NULL DEFAULT 0,
  last_daily_grant TIMESTAMP,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL
);
```

#### 🔒 Security Considerations

- **Secret Key Handling:** Only displays first 10 characters in logs
- **Database URL:** Shows only first 20 characters in logs
- **User Data:** Does not log sensitive information beyond what's needed
- **Error Handling:** Prevents script from crashing on individual user failures

#### 🐛 Troubleshooting

##### Common Issues

**"CLERK_SECRET_KEY is not set"**

- Solution: Add your Clerk secret key to `.env.local`
- Location: Clerk Dashboard → API Keys → Secret Key

**"DATABASE_URL is not set"**

- Solution: Add your PostgreSQL connection string to `.env.local`
- Format: `postgresql://user:password@host:port/database`

**"Failed to fetch users from Clerk"**

- Check your secret key is valid and has proper permissions
- Verify your Clerk organization has users
- Check network connectivity

**Database connection errors**

- Verify your DATABASE_URL is correct
- Ensure your database is running and accessible
- Check that the `users` and `userTokens` tables exist

##### Debug Mode

For additional debugging, you can modify the script to:

1. Add more detailed error logging
2. Adjust the batch size (change `limit` variable)
3. Test with a smaller subset of users first

#### 🔄 Safe Re-running

The script is designed to be safe to run multiple times:

- **Idempotent:** Running twice produces the same result
- **Duplicate Prevention:** Skips users that already exist
- **Graceful Failures:** Individual user failures don't stop the entire process

#### 📈 Performance Notes

- **Batch Processing:** Fetches users in batches of 500
- **Database Efficiency:** Uses prepared statements via Drizzle ORM
- **Memory Usage:** Loads all users into memory (consider batch processing for very large user bases)

#### 🛠️ Customization

You can customize the script by modifying:

- **Token Defaults:** Change initial balance and daily allowance
- **Batch Size:** Adjust Clerk API request limit
- **Logging Level:** Add or remove log statements
- **Error Handling:** Customize retry logic or failure responses

#### 📋 Example Output

```
🚀 Starting Clerk to Database user sync...

🧪 DRY RUN MODE ENABLED - No database changes will be made
💡 This will show you exactly what would be synced

🔧 Checking environment variables...
✅ DATABASE_URL is set
✅ CLERK_SECRET_KEY is set
🔑 Database URL: postgresql://user@...

🔍 Starting to fetch users from Clerk API...
📡 API Endpoint: https://api.clerk.com/v1/users
🔑 Using secret key: sk_test_abc...

📥 Fetching batch with offset 0, limit 500...
📡 Response status: 200 OK
📊 Received 3 users in this batch
📈 Total users collected so far: 3
🏁 Reached end of user list (batch smaller than limit)

✅ Successfully fetched 3 total users from Clerk

📋 Sample of fetched users:
   1. John Doe (john@example.com) - ID: user_abc123
   2. Jane Smith (jane@example.com) - ID: user_def456
   3. Bob Wilson (bob@example.com) - ID: user_ghi789

🗄️  Starting database sync analysis...
📊 Querying existing users from database...
📈 Found 0 existing users in database

🔄 Analyzing 3 Clerk users...

👤 User 1/3:
   📧 Email: john@example.com
   👋 Name: John Doe
   🆔 Clerk ID: user_abc123
   📅 Created: 2024-01-15T10:30:00.000Z
   🔄 Updated: 2024-01-15T10:30:00.000Z
   📝 First Name: John
   📝 Last Name: Doe
   📧 Email Objects: 1
   ✨ Status: NEW (will be added to database)
   📋 User record to insert:
      - id: user_abc123
      - createdAt: 2024-01-15T10:30:00.000Z
      - updatedAt: 2024-01-15T10:30:00.000Z
   🎫 Token record to insert:
      - userId: user_abc123
      - balance: 1000
      - dailyTokens: 100
      - lastDailyGrant: 2024-01-20T15:45:00.000Z
      - totalPurchased: 0
      - totalSpent: 0

📊 Analysis Summary:
• New users to add: 3
• Existing users to skip: 0
• Total Clerk users analyzed: 3
• Current database users: 0
• Database users after sync: 3

🧪 DRY RUN COMPLETE - No changes made to database
💡 To actually sync the users, set DRY_RUN = false in the script

🧪 DRY RUN COMPLETED - Review the output above
💡 To actually perform the sync, change DRY_RUN to false
```
