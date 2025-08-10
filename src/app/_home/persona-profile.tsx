import { PersonaData } from "@/types/persona.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  Briefcase,
  MoreHorizontal,
  Expand,
  Edit,
  Sparkles,
  Images,
} from "lucide-react";
import { ShootingStarIcon, StairsIcon } from "@phosphor-icons/react/dist/ssr";

type PersonaProfileProps = {
  data?: PersonaData;
  profileImageUrl?: string;
  changedProperties?: string[];
};

export default function PersonaProfile(props: PersonaProfileProps) {
  const { data, profileImageUrl, changedProperties } = props;

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">No persona data available</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:mt-12">
      <div className="flex gap-8">
        {/* Left Side - Profile Image (Desktop Only) */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-6">
            <div className="w-full h-96 rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/20">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${data.name || "Profile"} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <span className="text-6xl font-bold text-primary">
                    {getInitials(data.name)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - All Content */}
        <div className="flex-1 space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 lg:hidden">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={profileImageUrl}
                  alt={`${data.name || "Profile"} profile`}
                />
                <AvatarFallback className="text-xl font-semibold text-primary">
                  {getInitials(data.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {data.name || "Unknown"}
                </h1>
              </div>
            </div>

            <div className="hidden lg:block">
              <h1 className="text-4xl font-bold mb-4 text-primary">
                {data.name || "Unknown"}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {data.age && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{data.age}</span>
                </div>
              )}

              {data.gender && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>{data.gender}</span>
                </div>
              )}
            </div>

            {data.summary && (
              <p className="text-lg leading-relaxed text-foreground">
                {data.summary}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Images className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
            <Button variant="outline" className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Images
            </Button>
          </div>

          <Separator />

          {/* Main Sections */}
          <div className="space-y-8">
            {data.appearance && (
              <ProfileSection
                title="Appearance"
                content={data.appearance}
                isChanged={changedProperties?.includes("appearance")}
              />
            )}

            {data.personality && (
              <ProfileSection
                title="Personality"
                content={data.personality}
                isChanged={changedProperties?.includes("personality")}
              />
            )}

            {data.background && (
              <ProfileSection
                title="Background"
                content={data.background}
                isChanged={changedProperties?.includes("background")}
              />
            )}

            {/* Extensions */}
            {data.extensions &&
              Object.entries(data.extensions).map(([key, value]) => (
                <ProfileSection
                  key={key}
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                  content={value}
                  isChanged={changedProperties?.includes(`extensions.${key}`)}
                />
              ))}
          </div>

          {/* Enhance Button */}
          <div className="flex justify-center pt-8 sticky bottom-5">
            <Button
              size="lg"
              className="px-24 py-6 shadow-xl shadow-primary/50 text-md"
            >
              <ShootingStarIcon />
              Enhance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ProfileSectionProps = {
  title: string;
  content: string;
  isChanged?: boolean;
};

function ProfileSection({ title, content, isChanged }: ProfileSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
          {title}
          {isChanged && (
            <Badge variant="secondary" className="text-xs">
              Updated
            </Badge>
          )}
        </h2>
        <SectionDropdown />
      </div>
      <p className="text-foreground leading-relaxed">{content}</p>
    </div>
  );
}

function SectionDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Expand className="w-4 h-4 mr-2" />
          Expand
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className="w-4 h-4 mr-2" />
          Rewrite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
