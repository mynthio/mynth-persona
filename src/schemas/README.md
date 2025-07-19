# Schema Organization

This directory contains Zod schemas organized for optimal code sharing and security.

## Directory Structure

```
src/schemas/
├── shared/           # Schemas safe for both frontend and backend
│   ├── persona.schema.ts
│   └── index.ts
├── backend/          # Backend-only schemas (may contain sensitive data)
│   ├── persona.schema.ts
│   └── index.ts
├── transformers/     # Data transformation utilities
│   ├── persona.transformer.ts
│   └── index.ts
├── index.ts          # Main export file
└── README.md
```

## Usage Patterns

### Frontend Code
```typescript
// ✅ Safe - only import shared schemas
import { PublicPersonaWithVersion } from "@/schemas/shared";

// ✅ Also safe - main index re-exports shared schemas
import { PublicPersonaWithVersion } from "@/schemas";
```

### Backend Code
```typescript
// ✅ Full access to all schemas
import { PersonaWithVersion, PublicPersonaWithVersion } from "@/schemas";

// ✅ Explicit backend-only import
import { PersonaData } from "@/schemas/backend";

// ✅ Explicit shared import
import { PublicPersonaData } from "@/schemas/shared";
```

### API Routes
```typescript
// OLD
import { Persona } from "@/types/persona.type";
// Manual data filtering

// NEW
import { transformToPublicPersona, transformToPublicPersonaVersion } from "@/schemas/transformers";

// For persona endpoints
const publicPersona = transformToPublicPersona(internalPersona);

// For persona version endpoints
const publicPersonaVersion = transformToPublicPersonaVersion(internalPersonaVersion);
```

## Schema Types

### Shared Schemas (`/shared`)
- **Public data only** - safe to expose via API
- **No sensitive information** - user IDs, internal metadata excluded
- **Frontend compatible** - can be bundled with client code
- **Type-safe API contracts** - ensures consistent data shapes

### Backend Schemas (`/backend`)
- **Complete data models** - includes all database fields
- **Sensitive information** - user IDs, internal metadata, etc.
- **Server-side only** - never bundled with client code
- **Database integration** - uses drizzle-zod for type generation

## Benefits

1. **Security**: Prevents accidental exposure of sensitive data
2. **Type Safety**: Ensures API contracts match expected data shapes
3. **Code Sharing**: Reduces duplication between frontend/backend
4. **Maintainability**: Clear separation of concerns
5. **Bundle Size**: Frontend only includes necessary schemas

## Migration from Old Types

The project is transitioning from `/src/types/persona.type.ts` to the new schema structure:

### Current Status
- ✅ **New schema structure created**
- ✅ **API routes updated** to use public schemas
- ✅ **Query hooks updated** with proper typing
- 🔄 **Legacy imports** still exist in many files

### Migration Strategy
```typescript
// OLD (gradually migrate away from)
import { PersonaData } from "@/types/persona.type";

// NEW (backend code)
import { PersonaData } from "@/schemas/backend";

// NEW (frontend code - use public types)
import { PublicPersonaData } from "@/schemas/shared";
```

### Files to Migrate
The following files still use old imports and can be migrated gradually:
- Components: Use `@/schemas/shared` for public data
- Services/Actions: Use `@/schemas/backend` for full data
- API Routes: Already updated ✅

## Adding New Schemas

1. **Determine scope**: Is this shared or backend-only?
2. **Create schema file** in appropriate directory
3. **Export from index.ts** in that directory
4. **Document public API** if creating shared schemas
5. **Add validation** in API routes using the schemas