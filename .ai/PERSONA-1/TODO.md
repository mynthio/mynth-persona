# TODO — Persona Chat Implementation

Ordered checklist based on .ai/PERSONA-1/TASK.md

1. Database schema

- [x] Add chats table (id, user_id, persona_id, persona_version_id, title, mode enum['roleplay'|'story'] default 'roleplay' not null, settings jsonb, created_at, updated_at)
- [x] Add messages table (id, parent_id nullable, chat_id, role varchar, parts jsonb, created_at, updated_at)
- [x] Update images table to optionally reference messages (one message -> many images)
- [x] Add roleplay_data jsonb to persona_versions
- [x] Write Drizzle schema + migrations for the above

2. Redis (key-value store) (LATER)

- [ ] Implement per-chat generation lock (prevent concurrent streams per chat_id)
- [ ] Store stream/session reference for reconnecting to ongoing generation

3. Backend — new chat flow

- [ ] Verify user ownership of persona and fetch current persona_version
- [ ] If persona_version.roleplay_data is missing, generate and persist with fields: appearance (short, detailed, comma-separated) and summary (concise persona overview)
- [ ] Create chat row with initial settings and selected model; include user persona and model ID inside chat.settings (jsonb)
- [ ] On new chat, hydrate defaults from localStorage when "reuse for new chats" is enabled
- [ ] (Future) Optional: consider generating a scenario from persona data to enhance roleplay

4. Backend — fetching messages (history)

- [ ] Implement recursive query to fetch messages starting from leafId
- [ ] Default leafId to latest message in chat when none provided
- [ ] Limit to 50 per request for pagination/infinite loading
- [ ] API: GET /api/chats/:chatId/messages?leafId=&cursor=

5. Backend — sending a message (continuation)

- [ ] Verify user access to chat
- [ ] Fetch last 10–20 messages for context
- [ ] Resolve persona + model from chat.settings (jsonb) and include in AI SDK call
- [ ] Call AI SDK with context + user message + persona, stream tokens to client
- [ ] On finish, persist AI response as a message (role="assistant")
- [ ] Update images trigger (see section 7) after stream completes
- [ ] Return new leafId to client; frontend will store it in localStorage
- [ ] API: POST /api/chats/:chatId/messages

6. Backend — branching/regeneration

- [ ] When regenerating, create a new message with the same parent_id as the message being refreshed
- [ ] Stream new assistant response; persist as sibling branch
- [ ] Update returned leafId accordingly
- [ ] API: POST /api/chats/:chatId/messages/:messageId/regenerate

7. Image generation (post-response)

- [ ] After assistant message completes, enqueue trigger.dev job to generate an image (FLUX Schnell for experiment)
- [ ] Associate generated images to the assistant message (images -> message_id)

8. Frontend — chat UI/UX

- [ ] Integrate AI SDK Elements (Prompt input, Messages list, streaming display, autoscroll)
- [ ] Implement model selector in chat settings (reads/writes to chat.settings; default from localStorage when creating)
- [ ] Implement User Persona fields in chat settings: name, appearance (short, detailed, comma-separated), overview (concise)
- [ ] Manage leafId in localStorage; update on generation finish
- [ ] Implement infinite loading of older messages (uses backend pagination, 50 per request)
- [ ] Support regeneration/branching UI (create sibling from same parent)
- [ ] Reconnect to in-progress stream using backend’s stored stream reference

9. Frontend — Workbench (dynamic sidebar)

- [ ] Make sidebar tabs depend on active content type
- [ ] Persona: tabs [enhance, publish]
- [ ] Gallery: tabs [imagine, advanced]
- [ ] Chat: tabs [chats, settings]
- [ ] Ensure routing/state updates switch tabs correctly

9. Access control, limits, and robustness

- [ ] Enforce user ownership checks on all chat/message endpoints
- [ ] Add rate limiting for message generation endpoints
- [ ] Handle stream cancellation/timeouts and cleanup Redis locks
- [ ] Error handling for outdated/invalid leafId

10. Logging/analytics

- [ ] Add structured logs around generation lifecycle (start, stream, finish, errors)
- [ ] Track basic metrics (time-to-first-token, total duration, tokens used)

11. Open decision

- [ ] Decide behavior when client leafId is outdated (accept and branch vs. auto-switch to latest DB leaf); implement chosen strategy
