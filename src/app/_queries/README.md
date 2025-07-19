# Query Hooks

This directory contains SWR-based query hooks for fetching and mutating data.

## Available Queries

### Persona Queries

- `usePersonaQuery(id)` - Fetch a single persona by ID
- `usePersonaMutation(id)` - Mutate persona data

### Persona Version Queries

- `usePersonaVersionQuery(id)` - Fetch a persona version by ID
- `usePersonaVersionMutation(personaId, versionId)` - Mutate persona version data

### Persona Events Queries

- `usePersonaEventsQuery(personaId)` - Fetch all events for a persona (create/update events only, no image events)
- `usePersonaEventsMutation(personaId)` - Mutate persona events data

### Persona Images Queries

- `usePersonaImagesQuery(personaId)` - Fetch image IDs for a persona's gallery
- `usePersonaImagesMutation(personaId)` - Mutate cached list of image IDs

## Usage Examples

### Fetching Persona Events

```typescript
import { usePersonaEventsQuery } from "@/app/_queries/use-persona-events.query";

function PersonaEventsList({ personaId }: { personaId: string }) {
  const { data: events, error, isLoading } = usePersonaEventsQuery(personaId);

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error loading events</div>;
  if (!events) return <div>No events found</div>;

  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <h3>{event.type}</h3>
          <p>{event.userMessage}</p>
          {event.version && <span>Version {event.version.versionNumber}</span>}
          <time>{event.createdAt.toLocaleDateString()}</time>
        </div>
      ))}
    </div>
  );
}
```

### Mutating Persona Events

```typescript
import { usePersonaEventsMutation } from "@/app/_queries/use-persona-events.query";

function useAddPersonaEvent(personaId: string) {
  const mutateEvents = usePersonaEventsMutation(personaId);

  return (newEvent: PublicPersonaEventWithRelations) => {
    mutateEvents((currentEvents) => {
      if (!currentEvents) return [newEvent];
      return [newEvent, ...currentEvents];
    });
  };
}
```

## Type Safety

All queries use the new schema system:

- **Frontend**: Uses `PublicPersonaEventWithRelations` from `@/schemas/shared`
- **Backend**: Uses `PersonaEventWithRelations` from `@/schemas/backend`
- **API**: Automatically transforms backend data to public format using `transformToPublicPersonaEvents`

This ensures that sensitive data (like `userId`) is never exposed to the frontend.
