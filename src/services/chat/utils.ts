import { nanoid } from "nanoid";

import { MessageId } from "@/schemas/backend/messages/message.schema";

export const generateMessageId = () => `msg_${nanoid(32)}` satisfies MessageId;
