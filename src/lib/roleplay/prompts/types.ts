import { PersonaVersionRoleplayData } from "@/schemas";
import {
  ChatSettingsScenario,
  ChatSettingsUserPersona,
} from "@/schemas/backend/chats/chat.schema";

export type RoleplayPromptArgs = {
  persona: PersonaVersionRoleplayData;
  user?: ChatSettingsUserPersona | null;
};

export type RoleplayScenarioArgs = RoleplayPromptArgs & {
  scenario: ChatSettingsScenario;
};
