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
  COBRA_API_SERVER: {
    public: true,
    schema: optionalString,
  },
});
