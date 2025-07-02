import "server-only";

import { LogSnag } from "@logsnag/node";

const logsnag = new LogSnag({
  token: process.env.LOG_SNAG_TOKEN!,
  project: process.env.LOG_SNAG_PROJECT!,
});

export default logsnag;
