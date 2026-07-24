import { defineEnvVars } from "@sveltejs/kit/hooks";

export const variables = defineEnvVars({
  COBRA_API_SERVER: {
    public: true,
  },
});
