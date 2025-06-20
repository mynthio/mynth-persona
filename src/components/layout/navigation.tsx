import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function Navigation() {
  return (
    <div className="flex items-center justify-between h-nav px-12">
      <div>
        <Link href={"/"}>Peronsa</Link>
        <Link href={"/tokens"}>Tokens</Link>
      </div>
      <div>
        <SignedIn>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton>Signin</SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
