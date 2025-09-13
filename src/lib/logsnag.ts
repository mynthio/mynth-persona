import "server-only";

import { LogSnag } from "@logsnag/node";

import crypto from "crypto";

const logsnag = new LogSnag({
  token: process.env.LOG_SNAG_TOKEN!,
  project: process.env.LOG_SNAG_PROJECT!,
});

export const trackGeneratePersonaCompleted = async ({
  isAnonymous,
  userId,
  modelId,
}: {
  isAnonymous: boolean;
  userId: string;
  modelId: string;
}) => {
  const hashedUserId = hashSensitive(userId);

  await logsnag
    .track({
      channel: "personas",
      event: isAnonymous
        ? "generate-persona-anonymous-success"
        : "generate-persona-success",
      user_id: hashedUserId,
      icon: "🦔",
      tags: {
        model: modelId,
        user: hashedUserId,
      },
    })
    .catch((err) => {});
};

function hashSensitive(userId: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(userId);
  return hash.digest("hex");
}

export default logsnag;
