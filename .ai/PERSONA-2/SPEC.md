# Public Personas Feature Specification

## Overview

Implement a public personas feature that allows users to publish their personas for community discovery and use. The system leverages AI for automated content tagging, NSFW classification, and content moderation to ensure consistent quality and appropriate categorization.

## Core Design Decisions

### 1. Reuse Existing Personas Table
- **Rationale**: Maintain simplicity in chat creation logic
- **Approach**: Add visibility flags instead of creating separate public personas table
- **Benefit**: Existing chat system works unchanged - if user had access at chat creation time, they retain access

### 2. Immutable Public Versions
- **Constraint**: Once published, the specific persona version cannot be changed
- **Implementation**: `publicVersionId` locks the published version
- **Benefit**: Ensures consistency for users who create chats with public personas

### 3. AI-Powered Publishing Pipeline
- **Process**: Publishing triggers AI analysis instead of manual user input
- **Benefits**: Consistent tagging, automated NSFW classification, content quality control
- **Moderation**: Discord-based reporting for MVP, with future automated flagging

### 4. Gender as Explicit Column vs Tags
- **Decision**: Use explicit `gender` enum column instead of tags
- **Rationale**: Gender is a primary filter criterion that users expect to be reliable and consistent
- **Benefits**: Better query performance, guaranteed presence, cleaner UI filtering
- **Enum Values**: `['female', 'male', 'other']` with default `'other'` (simplicity)

### 5. Display Data Denormalization
- **Decision**: Cache `publicName` and `publicAge` directly in personas table
- **Rationale**: Avoid expensive joins for persona list views that show thousands of items
- **Trade-off**: Slight data duplication for significant performance gains
- **Consistency**: Data is locked at publish time via `publicVersionId` reference
- **Age Format**: Integer type for predictable UI, AI converts text to numbers, -1 for unknown
- **Public Avatar**: Reuse persona `profileImageId` as the public avatar; if missing, show a safe placeholder. When `profileImageId` changes, re-evaluate `nsfwRating` as needed.

## Database Schema Changes

### Modified Personas Table

```sql
-- Add to existing personas table:
visibility: pgEnum('persona_visibility', ['private', 'public', 'deleted']) NOT NULL DEFAULT 'private'
publicVersionId: text REFERENCES persona_versions(id)
nsfwRating: pgEnum('nsfw_rating', ['sfw', 'suggestive', 'explicit']) NOT NULL DEFAULT 'sfw'
gender: pgEnum('persona_gender', ['female', 'male', 'other']) NOT NULL DEFAULT 'other'
headline: text -- AI-generated catchy one-liner to attract clicks
-- Denormalized display data from publicVersionId for performance
publicName: varchar(100) -- Cached from persona version
publicAge: integer NOT NULL DEFAULT -1 -- AI-determined numeric age, -1 if unknown/undefined
ageBucket: pgEnum('persona_age_bucket', ['unknown','0-5','6-12','13-17','18-24','25-34','35-44','45-54','55-64','65-plus']) NOT NULL DEFAULT 'unknown' -- Derived by AI during publish
likesCount: integer NOT NULL DEFAULT 0
publishedAt: timestamp
deletedAt: timestamp
slug: varchar(200) UNIQUE -- Stable public URL identifier (name + headline + nanoid(6))
lastPublishAttempt: jsonb -- { status, error?, runId?, attemptedAt, tagsGenerated?, nsfwRatingAssigned? }
```

### New Tags System

```sql
-- Predefined tags for consistent AI tagging and UI filtering
CREATE TABLE tags (
  id text PRIMARY KEY,
  name varchar(50) NOT NULL UNIQUE, -- App-level: always lowercase
  category pgEnum('tag_category', ['appearance', 'personality', 'physical', 'age', 'style', 'other']) NOT NULL,
  isVisible boolean NOT NULL DEFAULT true, -- Show in UI filters
  sortOrder integer NOT NULL DEFAULT 0, -- UI ordering
  createdAt timestamp NOT NULL DEFAULT NOW()
);

-- Many-to-many relationship with confidence scoring
CREATE TABLE persona_tags (
  personaId text NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tagId text NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  confidence smallint NOT NULL DEFAULT 100, -- AI confidence score 0-100
  createdAt timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY (personaId, tagId),
  CHECK (confidence >= 0 AND confidence <= 100)
);
```

### Indexes (MVP)

```sql
-- Keep indexes minimal for MVP; add more after observing real usage
CREATE INDEX personas_visibility_idx ON personas(visibility);
CREATE INDEX personas_nsfw_rating_idx ON personas(nsfwRating);
CREATE INDEX personas_gender_idx ON personas(gender);
-- Note: no unique constraint on publicVersionId (managed at application level)
```

## Catchy Headlines Examples

The `headline` field should be a compelling one-liner that entices users to click on the persona tile. Examples:

- "A mysterious artist with secrets to share"
- "Your confident workout partner and motivator"
- "Sweet bookworm who loves deep conversations"
- "Adventurous traveler with endless stories"
- "Caring nurse who always puts others first"
- "Rebellious musician with a soft heart"
- "Elegant CEO who knows what she wants"
- "Playful gamer girl next door"

**AI Generation Guidelines:**
- Keep under 50 characters for mobile display
- Focus on personality + role/archetype combination
- Use active, engaging language
- Avoid explicit content in headlines (save for tags/rating)
- Make it intriguing but not misleading

## Age Parsing, Buckets and Display

**AI Age Parsing Logic:**
- Extract numeric age from persona text (e.g., "25 years old" → 25)
- Handle ranges by taking midpoint (e.g., "early 20s" → 22, "mid-30s" → 35)
- Use descriptive terms mapping (e.g., "young adult" → 22, "mature" → 35)
- Set -1 for completely unknown or intentionally undefined ages

**Age Buckets (enum persona_age_bucket):**
- `unknown`, `0-5`, `6-12`, `13-17`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65-plus`
- Assigned by publishing AI and stored in `ageBucket`

**UI Display Rules:**
- Show actual number when age > 0 (e.g., "25")
- Show "Age unknown" or hide age field when age = -1
- Enable filtering by buckets for public personas; sort unknown at the end

## NSFW Rating Policy

- Enum: `nsfw_rating` = ['sfw', 'suggestive', 'explicit'] (default 'sfw').
- Filtering semantics: selecting "Explicit" in UI should show Explicit only by default; "All adult" can include both Suggestive and Explicit. UX decision to be finalized with design.
- Publishing rules:
  - If age < 18 and AI determines nsfw != 'sfw' → block publish for manual review.
  - If age is unknown: allow suggestive/explicit, but treat them as adult-only in discovery.
  - Image handling (MVP): we skip image AI. We will use an `isNSFW` boolean on the image table; if a persona's profile image has `isNSFW = true`, set persona `nsfwRating = 'explicit'`.
  - If user updates profile image, re-evaluate and update `nsfwRating` accordingly.

## Predefined Tags Structure

### Tag Categories

**Appearance (Eyes, Hair, etc.)**
- `blue-eyes`, `green-eyes`, `brown-eyes`, `hazel-eyes`
- `long-hair`, `short-hair`, `blonde-hair`, `brunette`, `redhead`
- `pale-skin`, `tan-skin`, `dark-skin`

**Physical Attributes**
- `slim`, `fit`, `curvy`, `petite`, `tall`
- `athletic`, `elegant`, `casual`

**Age**
- `young`, `mature`, `teen`, `adult`, `middle-aged`

**Personality Traits**
- `sweet`, `confident`, `shy`, `outgoing`, `mysterious`
- `playful`, `serious`, `caring`, `independent`, `annoying`

**Style/Vibe**
- `sexy`, `cute`, `elegant`, `casual`, `gothic`, `dark`
- `romantic`, `adventurous`, `intellectual`

**Other (not shown in UI filters)**
- `fantasy`, `modern`, `historical`, `sci-fi`
- `professional`, `student`, `artist`

## AI Publishing Pipeline

### Publishing Workflow

1. **User Initiates Publishing**
   - User clicks "Publish" on persona
   - System sets `lastPublishAttempt.status = 'pending'`
   - Trigger.dev job queued

2. **AI Processing**
   - Analyze persona data (name, summary, roleplay data)
   - Generate relevant tags with confidence scores (app enforces lowercase)
   - Determine NSFW rating based on content
   - Extract/determine gender from persona data (defaults to 'other')
   - Parse age from text to numeric value (set -1 if unknown/undefined) and assign `ageBucket`
   - Create catchy headline to attract user clicks
   - Cache display data (name, numeric age) from persona version
   - Generate a stable `slug` (name + headline + nanoid(6)) and store

3. **Publishing Completion**
   - Insert tags into `persona_tags` table (confidence 0-100)
   - Set `nsfwRating`, `gender`, `headline`, `ageBucket`
   - Cache `publicName`, `publicAge` (as integer) from persona version
   - Set `visibility = 'public'`, `publishedAt = NOW()`
   - Update `lastPublishAttempt` with success status

4. **Error Handling**
   - On failure: set `lastPublishAttempt.status = 'failed'`
   - Include error message and runId for debugging
   - Allow retry mechanism

## Search and Discovery

### Tag-Based Filtering

Recommended query patterns:

- Must match ALL selected tags (N tags):
```sql
SELECT p.*
FROM personas p
JOIN persona_tags pt ON p.id = pt.personaId
WHERE p.visibility = 'public'
  AND pt.tagId = ANY($1) -- selected tag IDs
GROUP BY p.id
HAVING COUNT(DISTINCT pt.tagId) = $2; -- N
```

- EXISTS-per-tag (planner-friendly for small N):
```sql
SELECT p.*
FROM personas p
WHERE p.visibility = 'public'
  AND EXISTS (SELECT 1 FROM persona_tags pt WHERE pt.personaId = p.id AND pt.tagId = $1)
  AND EXISTS (SELECT 1 FROM persona_tags pt WHERE pt.personaId = p.id AND pt.tagId = $2);
```

### UI Filter Categories

- **Gender**: Female, Male, Other
- **Age Buckets**: Unknown, 0-5, 6-12, 13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+
- **Appearance**: Eye color, hair style, skin tone
- **Physical**: Body type, height, fitness level
- **Personality**: Character traits, demeanor
- **Style**: Aesthetic, vibe, fashion sense
- **Content Rating**: SFW, Suggestive, Explicit (Explicit and Suggestive are adult-only surfaces)

## Content Moderation

### Automated (AI)
- NSFW classification during publishing (text) and via image `isNSFW` flag (MVP)
- Tag confidence scoring for quality control
- Content analysis for inappropriate material

### Manual (Community)
- Discord-based reporting system for MVP
- Future: in-app reporting with automated flagging
- Moderator review queue for flagged content

### Cleanup Strategy
- Periodic cleanup of `deleted` personas not used in any chats
- Retention policy for unused public personas
- Analytics tracking for popular vs. unused content

## Future Enhancements

### Analytics & Ranking (Phase 2)
- Redis-based ranking system (Upstash)
- Temporary ranking data (monthly/weekly)
- Metrics: likes, chat creations, search appearances
- Trending personas algorithm

### Advanced Features
- User collections/favorites
- Persona recommendations
- Advanced search with multiple filters
- Creator profiles and following

## Implementation Phases

### Phase 1: Core Infrastructure
1. Database schema migration
2. Predefined tags seeding
3. Basic publishing workflow
4. AI tagging integration

### Phase 2: Discovery UI
1. Public personas browse page
2. Tag-based filtering interface
3. Search functionality
4. Persona detail pages

### Phase 3: Community Features
1. Likes system
2. Reporting mechanism
3. User profiles
4. Analytics dashboard

### Phase 4: Advanced Features
1. Redis ranking system
2. Recommendation engine
3. Advanced moderation tools
4. Creator monetization

## Technical Considerations

### Performance
- Keep indexes minimal for MVP; add based on observed bottlenecks later
- Tag-based search patterns documented above
- Caching strategy for popular personas
- Pagination for large result sets

### Scalability
- Join table approach scales better than arrays for complex queries
- AI processing queue prevents blocking user interactions
- Confidence scoring enables quality-based filtering

### Security & Policy
- NSFW content filtering (Explicit/Suggestive are adult-only)
- Block publish when AI flags explicit/suggestive for age < 18
- Image `isNSFW` flag sets persona NSFW to Explicit (MVP behavior)
- User reporting system
- Privacy controls (visibility settings)

## Success Metrics

- **Publishing Success Rate**: % of personas successfully processed by AI
- **Tag Accuracy**: User feedback on AI-generated tags
- **Discovery Engagement**: Search usage, filter interactions
- **Content Quality**: Report rates, moderation actions
- **User Adoption**: Public persona creation rate, chat creation from public personas