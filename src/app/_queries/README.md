# Query Hooks

This directory contains SWR-based query hooks for fetching and mutating data.

## Available Queries

### Persona Queries

- `usePersonaQuery(id)` - Fetch a single persona by ID
- `usePersonaMutation(id)` - Mutate persona data

### Persona Version Queries

- `usePersonaVersionQuery(id)` - Fetch a persona version by ID
- `usePersonaVersionMutation(personaId, versionId)` - Mutate persona version data

### Persona Images Queries

- `usePersonaImagesQuery(personaId)` - Fetch image IDs for a persona's gallery
- `usePersonaImagesMutation(personaId)` - Mutate cached list of image IDs

## Usage Examples



## Type Safety

All queries use the new schema system:

- **Frontend**: Uses public schema types from `@/schemas/shared`
- **Backend**: Uses backend schema types from `@/schemas/backend`
- **API**: Automatically transforms backend data to public format

This ensures that sensitive data (like `userId`) is never exposed to the frontend.
