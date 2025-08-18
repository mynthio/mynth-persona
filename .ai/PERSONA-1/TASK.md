# POERSONA-1 Implement chat for Personas

The task is to implement a chat feature for personas.

# Features

- Chat with Persona using AI models
- Support branching
- Keep conversations history in database
- Add model selector
- Add some basic settings for start
- Generate images for every AI response for immersive chat experience (for now FLUX Shnell for experiment and lower cost)

# Backend

## Database Schema

- chats
  - id
  - user_id -> users
  - persona_id -> personas
  - persona_version_id -> persona versions (for consistent chat use a specific version, allow user to update manually)
  - title (optional, by default "New chat" or "Untitled")
  - mode (enum: 'roleplay' | 'story', default 'roleplay', not null)
  - settings (jsonb)
  - created_at
  - updated_at
- messages
  - id
  - parent_id -> messages (nullable, self reference, used for branching, null for root message)
  - chat_id -> chats
  - role (varchar, no enum, simple varchar)
  - parts (jsonb)
  - images (not actual column, but images table should now have optional reference to messages, one message can have multiple images)
  - created_at
  - updated_at

Update to current schema:

- persona_versions
  - add roleplay_data (jsonb)

## Fetching messages

Use recursive query to fetch messages for a chat, starting from the leaf. The leaf ID is either provided by frontend, or quered from DB (latest message in chat is the default leaf ID).

Leaf ID from client side is handled in localStorage not in Database. This is for simplicity, and lower DB overhead (no need to update chat table every time message is generated or branch is switched which can get messy and lot of requests). On the other hand it's more error prune.

We limit the messages to 50 per request, fetching from the leaf up to the tree. On frontend we're going to use infinite loading to fetch more when necessery only.

Questions:

- When user requests to fetch messages with leafId, it might not be the latest leaf ID in DB, because user might have outdated data in localStorage (for example, using chat on PC and phone). In this case, how to verify it? Should we try to always find the latest leaf ID in DB, or just return such messages, and let user continue from this point (this will make a new branch, but user might not be happy to lost content from the phone)

## Branching

When user refreshes/regenerates the message it creates a new branch. Simply by creating new message, with same parent_id as the triggered one. By using parent_id column we create a tree like structure for branches. It's pretty efficient, and one of the simplest solutions to support branching without bloating req/res with huge data consisting every messages etc.

## Image generation

Each AI response, on finish triggers a trigger.dev job to generate an image. This will be a new job, but we will work on this as a last step, after the chat logic is fully completed.

## Backend/API logic

The logic behind the chat will be mostly based on the chat-sdk by Vercel: https://github.com/vercel/ai-chatbot

## Redis / key-value storage

We're going to use redis for 2 things here.

- Block the message generation if there's already one in progress. Based on chat_id. Single stream for single chat.
- Keep the reference for reconnecting to stream (ex. if user refreshes the page or leaves and come back before generation finishes). Also based on the mentioned Vercel chatbot example, but we will user Redis instead of keeping streams in Postgresql DB.

## Preparing roleplay data

When user starts a new chat we fetch persona to verify ownership, including the persona current version. If the fetched version does not have roleplay_data defined and ready to go, we generate it, by using some fast model, to generate roleplay data based on persona data. We update persona version with generated roleplay_data and we continue with creating a chat and a session normally with AI SDK.

**Roleplay data structure:**
- appearance: Short but detailed, comma-separated description of the persona's appearance
- summary: Short as possible version of entire persona data for AI model to roleplay and know the persona

*Note: Scenario generation based on persona data can be considered for future implementation to enhance roleplay experience.*

## On continuation

User sends a message with content. We fetch chat and verify user has access. We fetch last 10-20 messages from DB, and we send them to AI SDK with user message. AI SDK will return a stream, which we send to client. On finish we update the DB. In user's localStorage we set the new leafID, when the generation is finished.

## User Persona (localStorage)

Decision: For v1 we will store user persona and model ID inside chats.settings (jsonb). Users enter persona details on the page; if they select "reuse for new chats", we persist in localStorage and hydrate these defaults into newly created chats' settings.

- On new chat: read persona/model from localStorage when "reuse" is enabled and write them into chat.settings.
- On continuation: use persona/model from chat.settings when calling the AI SDK.
- We will not send persona per request from the client separately in v1 (server derives from chat.settings).

# UI/UX

## Components

We're going to use https://ai-sdk.dev/elements/overview from Vercel for things like Prompt, messages, scrolling etc.

## AI SDK

For any interaction with AI here, we're going to use AI SDK from Vercel: https://ai-sdk.dev/docs/introduction

## Styling

TODO: For now we prioritize finishing the core logic

## Workbench (Frontend)

Modify the workbench so the sidebar is dynamic based on content type:

- Persona: tabs = [enhance, publish]
- Gallery: tabs = [imagine, advanced]
- Chat (new content type and tab): tabs = [chats, settings]

The sidebar should switch tabs based on the active content type and route. Ensure the chat content type integrates with AI SDK Elements for the chat UI.

## Chat settings (Frontend)

For v1, implement only two settings in the chat settings sidebar:
- Model selection
- User persona: split into three fields — name, appearance (short and detailed, comma-separated), and overview (general, concise summary)

No other settings will be implemented for now.
