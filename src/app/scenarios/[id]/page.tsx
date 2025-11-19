import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/db/drizzle";
import { getImageUrl } from "@/lib/utils";
import { ScenarioContent } from "@/schemas";
import { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { auth } from "@clerk/nextjs/server";
import Form from "next/form";
import {
  BirdIcon,
  DotsThreeVerticalIcon,
  GlobeIcon,
  LockIcon,
  PencilIcon,
} from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { PublishScenarioDialog } from "./_components/publish-scenario-dialog.client";
import { CreateChatWithScenarioButton } from "@/components/create-chat-with-scenario-button";
import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Feather, Menu05 } from "@untitledui/icons";

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
      <div className="w-full h-full pb-16">
        <TopBar
          left={<TopBarSidebarTrigger />}
          center={
            <>
              <Feather strokeWidth={1.5} />
            </>
          }
          right={
            <>
              {scenario.creatorId === userId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Menu05 strokeWidth={1.5} />
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {scenario.visibility === "public" ? (
                      <DropdownMenuItem>
                        <LockIcon />
                        Unpublish
                      </DropdownMenuItem>
                    ) : (
                      <Form action={""}>
                        <input type="hidden" name="action" value="publish" />
                        <DropdownMenuItem asChild>
                          <button type="submit" className="w-full">
                            <GlobeIcon />
                            Publish
                          </button>
                        </DropdownMenuItem>
                      </Form>
                    )}
                    <DropdownMenuItem>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
        />

        {/* Hero Section with Background Image */}
        <div className="w-[calc(100%-24px)] px-4 max-w-[960px] mx-auto h-[40vh] z-0 relative flex flex-col justify-end items-center py-4 bg-gradient-to-tr from-purple-950 to-pink-800 overflow-hidden rounded-xl">
          <div className="flex flex-wrap gap-2 z-10 justify-start max-w-[720px] mx-auto w-full">
            <Badge variant="secondary" className="backdrop-blur-sm">
              {scenario.visibility === "public" ? (
                <GlobeIcon weight="fill" />
              ) : (
                <LockIcon weight="fill" />
              )}
              {scenario.visibility === "public" ? "Public" : "Private"}
            </Badge>

            {scenario.status && (
              <Badge variant="secondary" className="backdrop-blur-sm">
                {scenario.status === "community" && <BirdIcon weight="fill" />}
                {scenario.status}
              </Badge>
            )}

            {scenario.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="backdrop-blur-sm bg-white/10 border-white/20 text-white"
              >
                {tag}
              </Badge>
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

        <div className="max-w-[720px] mx-auto mt-6 px-4 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-onest text-3xl font-semibold leading-tight">
                {scenario.title}
              </h1>
              <p className="font-mono text-muted-foreground text-sm mt-1">
                by {scenario.creator?.username ?? "Anonymous"}
              </p>
            </div>
          </div>

          {/* Description */}
          {scenario.description && (
            <p className="text-base text-muted-foreground">
              {scenario.description}
            </p>
          )}

          {/* Personas Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                Personas
              </h2>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-3">
              {scenario.scenarioPersonas
                .sort((a, b) => a.roleType.localeCompare(b.roleType))
                .map((scenarioPersona) => (
                  <Card key={scenarioPersona.personaId} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="size-12 shrink-0 rounded-lg overflow-hidden relative bg-gradient-to-br from-purple-950 to-pink-800">
                        {scenarioPersona.persona.profileImageIdMedia && (
                          <img
                            src={getImageUrl(
                              scenarioPersona.persona.profileImageIdMedia
                            )}
                            alt={scenarioPersona.persona.title ?? ""}
                            className="absolute top-0 left-0 w-full h-full object-cover object-top"
                          />
                        )}
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-xs font-mono uppercase text-muted-foreground">
                          {scenarioPersona.roleType === "primary"
                            ? "Made for Persona"
                            : scenarioPersona.roleType}
                        </p>
                        <h3 className="truncate text-lg font-onest font-medium">
                          {scenarioPersona.persona.publicName ??
                            scenarioPersona.persona.title}
                        </h3>
                      </div>

                      <CreateChatWithScenarioButton
                        personaId={scenarioPersona.personaId}
                        scenarioId={scenario.id}
                        size="sm"
                      >
                        Launch
                      </CreateChatWithScenarioButton>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Scenario Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                Scenario
              </h2>
              <Separator className="flex-1" />
            </div>
            <Card>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <Response>{scenario.content.scenario_text}</Response>
              </CardContent>
            </Card>
          </div>

          {/* User Character */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                User Character
              </h2>
              <Separator className="flex-1" />
            </div>
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xl font-onest font-medium">
                  {scenario.content.suggested_user_name}
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Response>{scenario.content.user_persona_text}</Response>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Starting Messages */}
          {scenario.content.starting_messages &&
            scenario.content.starting_messages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                    Starting Messages
                  </h2>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-3">
                  {scenario.content.starting_messages.map((message, i) => (
                    <div className="flex justify-start" key={i}>
                      <Card className="max-w-[85%] rounded-2xl">
                        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                          <Response>{message.text}</Response>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Style Guidelines */}
          {scenario.content.style_guidelines && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                  Style Guidelines
                </h2>
                <Separator className="flex-1" />
              </div>
              <Card>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <Response>{scenario.content.style_guidelines}</Response>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Prompt Override */}
          {scenario.content.system_prompt_override && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                  System Prompt Override
                </h2>
                <Separator className="flex-1" />
              </div>
              <Card>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <Response>{scenario.content.system_prompt_override}</Response>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggested Models */}
          {scenario.suggestedAiModels &&
            scenario.suggestedAiModels.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">
                    Suggested Models
                  </h2>
                  <Separator className="flex-1" />
                </div>
                <Card>
                  <CardContent>
                    <ul className="space-y-2">
                      {scenario.suggestedAiModels.map((model, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Badge variant="outline">{model}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      </div>
      <PublishScenarioDialog />
    </>
  );
}
