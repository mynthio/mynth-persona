import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/mynth-ui/base/button";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { Label } from "@/components/mynth-ui/base/label";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuPositioner,
  MenuTrigger,
} from "@/components/mynth-ui/base/menu";
import { db } from "@/db/drizzle";
import { scenarios } from "@/db/schema";
import { getImageUrl } from "@/lib/utils";
import { CreateScenarioPayload, ScenarioContent } from "@/schemas";
import { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { auth } from "@clerk/nextjs/server";
import Form from "next/form";
import {
  BirdIcon,
  DotsThreeVerticalIcon,
  GlobeIcon,
  LockIcon,
  PencilIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { PublishScenarioDialog } from "./_components/publish-scenario-dialog.client";
import { CreateChatWithScenarioButton } from "@/components/create-chat-with-scenario-button";

export default async function ScenarioPage({
  params,
}: PageProps<"/scenarios/[id]">) {
  const { id } = await params;
  const { userId } = await auth();

  const scenario = await db.query.scenarios
    .findFirst({
      where: (scenariosTable, { eq, or, and }) =>
        and(
          eq(scenariosTable.id, id),
          or(
            eq(scenariosTable.visibility, "public"),
            userId ? eq(scenariosTable.creatorId, userId) : undefined
          )
        ),
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            imageUrl: true,
          },
        },
        scenarioPersonas: {
          with: {
            persona: {
              columns: {
                id: true,
                title: true,
                profileImageIdMedia: true,
                visibility: true,
                publicName: true,
              },
            },
          },
        },
      },
    })
    .then((scenario) => {
      if (!scenario) {
        notFound();
      }

      return {
        ...scenario,
        content: scenario.content as ScenarioContent,
        suggestedAiModels: scenario.suggestedAiModels as
          | TextGenerationModelId[]
          | null,
        creator:
          scenario.isAnonymous && scenario.creatorId !== userId
            ? null
            : scenario.creator,
      };
    });

  return (
    <>
      <div className="w-full h-full pb-[60px]">
        <div className="w-full h-[40vh] z-0 relative flex flex-col justify-end items-center py-[8px] bg-gradient-to-tr from-purple-950 to-pink-800 overflow-hidden rounded-t-[14px]">
          <div className="flex flex-wrap gap-[2px] z-10 justify-start max-w-[720px] mx-auto w-full">
            <div className="cursor-default pointer-events-none flex items-center gap-[4px] text-[0.80rem] bg-primary/50 backdrop-blur-[3px] rounded-[9px] h-[28px] px-[12px] text-primary-foreground/80">
              {scenario.visibility === "public" ? <GlobeIcon /> : <LockIcon />}
              {scenario.visibility === "public" ? "Public" : "Private"}
            </div>

            <div className="flex items-center gap-[4px] text-[0.80rem] bg-blue-800/50 backdrop-blur-[3px] rounded-[9px] h-[28px] px-[12px] text-primary-foreground/80">
              {scenario.status === "community" && <BirdIcon />}
              {scenario.status}
            </div>

            {scenario.tags?.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-[4px] text-[0.80rem] bg-primary/50 backdrop-blur-[3px] rounded-[9px] h-[28px] px-[12px] text-primary-foreground/80"
              >
                {tag}
              </div>
            ))}
          </div>
          {scenario.backgroundImageUrl && (
            <img
              src={scenario.backgroundImageUrl}
              alt={scenario.title}
              className="absolute left-0 top-0 w-full h-full object-cover object-center"
            />
          )}
        </div>

        <div className="max-w-[720px] mx-auto mt-[16px] px-[12px]">
          <div className="flex justify-between items-start">
            <div className="">
              <h1 className="font-onest text-[1.6rem] font-[600] leading-tight">
                {scenario.title}
              </h1>
              <div>
                <p className="font-mono text-surface-foreground/60 text-[0.90rem]">
                  by {scenario.creator?.username ?? "Anonymous"}
                </p>
              </div>
            </div>

            <ButtonGroup spacing="compact">
              {/* <Button size="sm" color="primary">
              Chat
            </Button> */}

              {scenario.creatorId === userId && (
                <Menu modal={false}>
                  <MenuTrigger
                    render={
                      <Button
                        className="bg-surface-100"
                        size="sm"
                        variant="outline"
                      />
                    }
                  >
                    <DotsThreeVerticalIcon weight="bold" />
                    Manage
                  </MenuTrigger>

                  <MenuPositioner>
                    <MenuPopup>
                      {scenario.visibility === "public" ? (
                        <MenuItem icon={<LockIcon />}>Unpublish</MenuItem>
                      ) : (
                        <Form action={""}>
                          <input type="hidden" name="action" value="publish" />
                          <MenuItem
                            nativeButton
                            render={<button type="submit" />}
                            icon={<GlobeIcon />}
                          >
                            Publish
                          </MenuItem>
                        </Form>
                      )}
                      <MenuItem icon={<PencilIcon />}>Edit</MenuItem>
                    </MenuPopup>
                  </MenuPositioner>
                </Menu>
              )}
            </ButtonGroup>
          </div>

          {scenario.description && (
            <div className="mt-[24px]">
              <p className="text-[0.95rem] text-surface-foreground/80">
                {scenario.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-[18px] mt-[24px]">
            <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
              Personas
            </span>
            <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
          </div>

          <div className="flex flex-col gap-[12px] mt-[24px]">
            {scenario.scenarioPersonas
              .sort((a, b) => a.roleType.localeCompare(b.roleType))
              .map((scenarioPersona) => (
                <div
                  key={scenarioPersona.personaId}
                  className="flex items-center gap-[12px]"
                >
                  <div className="size-[48px] shrink-0 aspect-square rounded-[12px] overflow-hidden relative bg-gradient-to-br from-purple-950 to-pink-800 z-0">
                    {scenarioPersona.persona.profileImageIdMedia && (
                      <img
                        src={getImageUrl(
                          scenarioPersona.persona.profileImageIdMedia
                        )}
                        alt={scenarioPersona.persona.title ?? ""}
                        className="absolute top-0 left-0 w-full h-full object-cover object-top -z-10"
                      />
                    )}
                  </div>

                  <div className="flex flex-col w-full">
                    <p className="text-[0.75rem] font-mono uppercase text-surface-foreground/50">
                      {scenarioPersona.roleType === "primary"
                        ? "Made for Persona"
                        : scenarioPersona.roleType}
                    </p>
                    <div className="truncate text-[1.1rem] font-onest">
                      {scenarioPersona.persona.publicName ??
                        scenarioPersona.persona.title}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <CreateChatWithScenarioButton
                      personaId={scenarioPersona.personaId}
                      scenarioId={scenario.id}
                      size="sm"
                      color="primary"
                    >
                      Launch scenario
                    </CreateChatWithScenarioButton>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex items-center gap-[18px] mt-[24px]">
            <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
              Scenario
            </span>
            <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
          </div>

          <div className="mt-[24px]">
            <Response>{scenario.content.scenario_text}</Response>
          </div>

          <div className="flex items-center gap-[18px] mt-[24px]">
            <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
              User Character
            </span>
            <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
          </div>

          <div className="mt-[24px]">
            <p className="text-[1.2rem] font-onest mb-[12px]">
              {scenario.content.suggested_user_name}
            </p>
            <Response>{scenario.content.user_persona_text}</Response>
          </div>

          {scenario.content.starting_messages &&
            scenario.content.starting_messages.length > 0 && (
              <>
                <div className="flex items-center gap-[18px] mt-[24px]">
                  <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
                    Starting Messages
                  </span>
                  <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
                </div>
                <div className="mt-[24px] flex flex-col gap-[12px]">
                  {scenario.content.starting_messages.map((message, i) => (
                    <div className="flex justify-start" key={i}>
                      <div className="bg-surface-100 rounded-[18px] px-[24px] py-[12px] w-auto min-w-0 max-w-[80%]">
                        <Response>{message.text}</Response>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          {scenario.content.style_guidelines && (
            <>
              <div className="flex items-center gap-[18px] mt-[24px]">
                <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
                  Style Guidelines
                </span>
                <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
              </div>
              <div className="mt-[24px]">
                <Response>{scenario.content.style_guidelines}</Response>
              </div>
            </>
          )}

          {scenario.content.system_prompt_override && (
            <>
              <div className="flex items-center gap-[18px] mt-[24px]">
                <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
                  System Prompt Override
                </span>
                <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
              </div>
              <div className="mt-[24px]">
                <Response>{scenario.content.system_prompt_override}</Response>
              </div>
            </>
          )}

          {scenario.suggestedAiModels &&
            scenario.suggestedAiModels.length > 0 && (
              <>
                <div className="flex items-center gap-[18px] mt-[24px]">
                  <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
                    Suggested Models
                  </span>
                  <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
                </div>
                <ul className="mt-[24px] flex flex-col gap-[2px]">
                  {scenario.suggestedAiModels.map((model, i) => (
                    <li className="flex justify-start" key={i}>
                      {model}
                    </li>
                  ))}
                </ul>
              </>
            )}
        </div>
      </div>
      {/* <div className="h-[300px]" /> */}
      <PublishScenarioDialog />
    </>
  );
}
