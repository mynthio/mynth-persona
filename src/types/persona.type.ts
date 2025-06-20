import "server-only";

import { personas } from "@/db/schema";
import { createSelectSchema } from "drizzle-arktype";

export const Persona = createSelectSchema(personas);

export type Persona = typeof Persona.infer;
