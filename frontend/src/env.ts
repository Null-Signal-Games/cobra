import { defineEnvVars } from "@sveltejs/kit/env";
import type { StandardSchemaV1 } from "@standard-schema/spec";

const optionalString: StandardSchemaV1<string | undefined, string> = {
  "~standard": {
    version: 1,
    vendor: "custom",
    validate: (value) => ({
      value: typeof value === "string" ? value : "",
    }),
  },
};

export const variables = defineEnvVars({
  // Used for client-side requests.
  CLIENT_COBRA_API_ENDPOINT: {
    public: true,
    schema: optionalString,
  },
  // Used for server-side requests.
  SERVER_COBRA_API_ENDPOINT: {
    public: false,
    schema: optionalString,
  },
});
