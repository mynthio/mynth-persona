import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DISCORD_INVITE_URL,
  INSTAGRAM_PROFILE_URL,
  X_PROFILE_URL,
  GITHUB_REPO_URL,
} from "@/lib/constants";
import { CreditCard01 } from "@untitledui/icons";
import { Link } from "@/components/ui/link";
import { DiscordLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { IconDots } from "@tabler/icons-react";

export function NavSecondary(props: React.ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <IconDots />
                  <span>More</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="top">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <a
                      href={INSTAGRAM_PROFILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={X_PROFILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      X
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <a href="/terms-of-service">Terms of Service</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/privacy-policy">Privacy Policy</a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/plans">
                <CreditCard01 strokeWidth={1.5} />
                <span>Pricing</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={DISCORD_INVITE_URL}>
                <DiscordLogoIcon />
                <span>Discord</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
