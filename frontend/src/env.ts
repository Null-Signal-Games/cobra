import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  COBRA_API_SERVER: {
    public: true,
    schema: {
      "~standard": {
        version: 1,
        vendor: "custom",
        validate: (value) => ({
          value: typeof value === "string" ? value : "",
        }),
      },
    },
  },
});
