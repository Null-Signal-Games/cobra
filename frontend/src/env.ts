import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  COBRA_API_SERVER: {
    public: true,
  },
});
