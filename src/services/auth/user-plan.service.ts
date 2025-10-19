import "server-only";

import { auth } from "@clerk/nextjs/server";

export const getUserPlan = async () => {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    return "free";
  }

  const planId =
    typeof sessionClaims.pla === "string"
      ? sessionClaims.pla?.split(":")[1]
      : "free";

  return planId;
};
