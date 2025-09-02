# Prompt System Documentation

This directory contains the prompt system architecture for the Mynth Persona application. The system is designed to manage both system prompts (for AI models) and user prompts (for user input templates) in a structured, type-safe manner.

## Architecture Overview

### Prompt Types

The system distinguishes between two types of prompts:

- **System Prompts** (`system.*`): Templates for AI model instructions and context
- **User Prompts** (`prompt.*`): Templates for user input construction

### Prompt ID Convention

All prompt IDs follow the pattern: `{kind}.{category}.{subcategory}.{version}`

Examples:
- `system.chat.roleplay.v1` - System prompt for roleplay chat
- `system.image.persona.v1` - System prompt for persona image generation
- `prompt.image.persona.v1` - User prompt template for persona image input

### File Naming Convention

Template files are named to match their prompt IDs exactly:
- `system.chat.roleplay.v1.ts` → exports prompt with ID `system.chat.roleplay.v1`
- `prompt.image.persona.v1.ts` → exports prompt with ID `prompt.image.persona.v1`

## Directory Structure

```
src/lib/prompts/
├── README.md                           # This documentation
├── types.ts                           # Type definitions
├── registry.ts                        # Prompt registration and defaults
└── templates/                         # Prompt template implementations
    ├── chat/
    │   ├── system.chat.roleplay.v1.ts # Roleplay chat system prompt
    │   └── system.chat.story.v1.ts    # Story chat system prompt
    ├── image/
    │   ├── system.image.persona.v1.ts # Image generation system prompt
    │   └── prompt.image.persona.v1.ts # Image generation user prompt
    └── persona/
        ├── system.persona.generate.v1.ts # Persona generation system prompt
        └── system.persona.enhance.v1.ts  # Persona enhancement system prompt
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

### Retrieving System Prompts

```typescript
import { getDefaultPromptDefinitionForMode } from '@/lib/prompts/registry'

// Get default system prompt for chat roleplay
const systemPrompt = getDefaultPromptDefinitionForMode('chat', 'roleplay')
const rendered = systemPrompt.render({ 
  modelName: 'gpt-4',
  persona: personaData 
})
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