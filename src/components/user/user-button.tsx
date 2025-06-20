"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";

export default function UserButton() {
  const user = useUser();

  if (!user.user) return null;

  return (
    <Button variant="faded" endContent={<Avatar src={user.user.imageUrl} />}>
      {user.user?.username}
    </Button>
  );
}
