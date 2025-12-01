# Prompt System Documentation

This directory contains the prompt system architecture for the Mynth Persona application. The system is designed to manage both system prompts (for AI models) and user prompts (for user input templates) in a structured, type-safe manner.

## Architecture Overview

### Roleplay Prompts (Simplified System)

**Roleplay prompts have been moved to a simplified system at `src/lib/prompts/roleplay/`.**

The new roleplay prompt system:
- Uses simple function exports with typed args (no IDs or versioning)
- Supports model-specific prompts for fine-tuning per AI model
- Ready for style variations (concise, rich, dialogue focused)

See `src/lib/prompts/roleplay/index.ts` for usage:
```typescript
import { getSystemPromptRendererForRoleplay } from '@/lib/prompts/roleplay';

// Get prompt renderer for a specific model (falls back to default)
const renderer = getSystemPromptRendererForRoleplay(modelId, style);
const systemPrompt = renderer({ character, user, scenario });
```

### Legacy Prompt Types

The legacy system (still used for story, impersonate, image, and persona prompts) distinguishes between:

- **System Prompts** (`system.*`): Templates for AI model instructions and context
- **User Prompts** (`prompt.*`): Templates for user input construction

## Directory Structure

```
src/lib/prompts/
├── README.md                              # This documentation
├── types.ts                               # Type definitions
├── registry.ts                            # Prompt registration and defaults
├── roleplay/                              # Simplified roleplay prompt system
│   ├── index.ts                           # Factory and exports
│   ├── types.ts                           # RoleplayPromptArgs, styles
│   └── default.ts                         # Default roleplay prompt
└── templates/                             # Legacy prompt implementations
    ├── roleplay/
    │   └── system.chat.impersonate.v1.ts  # Impersonate mode (uses legacy system)
    ├── story/
    │   └── system.chat.story.v1.ts        # Story chat system prompt
    ├── image/
    │   ├── system.image.persona.v1.ts     # Image generation system prompt
    │   └── prompt.image.persona.v1.ts     # Image generation user prompt
    └── persona/
        ├── system.persona.generate.v1.ts  # Persona generation system prompt
        └── system.persona.enhance.v1.ts   # Persona enhancement system prompt
```

## Core Components

### 1. Types (`types.ts`)

Defines the foundational types:

```typescript
type PromptKind = "system" | "prompt"
type PromptId = `${PromptKind}.${string}`

interface PromptDefinition<T extends Record<string, any> = {}> {
  id: PromptId
  render(args: T): string
}
```

### 2. Registry (`registry.ts`)

- **PROMPT_REGISTRY**: All available prompt templates
- **DEFAULT_SYSTEM_PROMPTS_BY_USE_CASE**: Default system prompts by use case
- **DEFAULT_PROMPTS_BY_USE_CASE**: Default user prompts by use case

### 3. Template Files

Each template exports a prompt definition with:
- Unique ID following the naming convention
- `render()` function that accepts typed arguments
- Clear TypeScript interfaces for render arguments

## Usage Examples

### Roleplay Prompts (New Simplified System)

```typescript
import { getSystemPromptRendererForRoleplay } from '@/lib/prompts/roleplay';

// Get renderer for a specific model (optional, falls back to default)
const renderer = getSystemPromptRendererForRoleplay(modelId);

// Render the system prompt
const systemPrompt = renderer({
  character: roleplayData,
  user: chatSettings.user_persona,
  scenario: chatSettings.scenario,
});
```

### Legacy System Prompts (Story, Impersonate, etc.)

```typescript
import { getDefaultPromptDefinitionForMode } from '@/lib/prompts/registry'

// Get default system prompt for story mode
const systemPrompt = getDefaultPromptDefinitionForMode('chat', 'story')
const rendered = systemPrompt.render({ character: personaData })
```

### Retrieving User Prompts

```typescript
import { getDefaultUserPromptDefinitionForMode } from '@/lib/prompts/registry'

// Get user prompt template for image generation
const userPrompt = getDefaultUserPromptDefinitionForMode('image', 'persona')
const rendered = userPrompt.render({
  persona: personaData,
  style: 'realistic',
  shotType: 'portrait',
  nsfw: false,
  userNote: 'Make it vibrant'
})
```

## Guidelines for Contributors

### Adding New Prompts

1. **Choose the correct prompt kind**:
   - Use `system.*` for AI model instructions
   - Use `prompt.*` for user input templates

2. **Follow naming conventions**:
   - ID: `{kind}.{category}.{subcategory}.{version}`
   - File: `{kind}.{category}.{subcategory}.{version}.ts`

3. **Create the template file**:
   ```typescript
   import { PromptDefinition } from '../../types'
   
   export const myPromptV1: PromptDefinition<{
     arg1: string
     arg2: boolean
   }> = {
     id: 'system.category.subcategory.v1',
     render({ arg1, arg2 }) {
       return `Your prompt template with ${arg1}`
     }
   }
   ```

4. **Register in registry.ts**:
   - Add import statement
   - Add to `PROMPT_REGISTRY`
   - Add to appropriate defaults if needed

5. **Update types.ts** if needed:
   - Add new prompt ID to `PromptId` type
   - Add interface for render arguments if reusable

### Versioning

- Start with `v1` for new prompts
- Increment version for breaking changes to render arguments
- Keep old versions for backward compatibility when possible

### Testing

Always test new prompts by:
1. Running `pnpm typecheck` to ensure type safety
2. Testing the render function with realistic data
3. Verifying the prompt produces expected AI responses

## Best Practices

### For System Prompts
- Be specific about the AI's role and behavior
- Include clear instructions and constraints
- Use consistent formatting and structure
- Consider model limitations and context windows

### For User Prompts
- Make templates flexible with good default values
- Include optional parameters for customization
- Validate required vs optional arguments
- Provide clear parameter documentation

### For Both
- Keep prompts focused on a single responsibility
- Use descriptive variable names in templates
- Include comments for complex logic
- Test with edge cases and empty values

## Migration Notes

This system was refactored to separate system and user prompts. Key changes:

- **Prompt IDs**: Now prefixed with `system.` or `prompt.`
- **File Names**: Match prompt IDs exactly
- **Registry**: Split into system and user prompt defaults
- **Getters**: New functions for system vs user prompts

## AI/LLM Usage Notes

When working with this prompt system:

1. **Understand the separation**: System prompts configure AI behavior, user prompts structure input
2. **Respect the types**: Use TypeScript interfaces to understand required arguments
3. **Follow conventions**: Maintain ID and file naming patterns
4. **Test thoroughly**: Verify both type safety and prompt effectiveness
5. **Version carefully**: Breaking changes require new versions

The system is designed to be type-safe, maintainable, and scalable for complex AI applications.