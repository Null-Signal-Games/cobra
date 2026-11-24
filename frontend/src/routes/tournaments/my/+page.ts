import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { v1Api } from "#lib/api/v1.ts";
import { oauthLoginUrl } from "#lib/utils/auth.svelte.ts";

export const load: PageLoad = async ({ fetch, parent, url }) => {
  const { user } = await parent();
  if (!user) {
    redirect(307, oauthLoginUrl(url.origin + url.pathname), { external: true });
  }

  return {
    user,
    tournamentsResponse: await v1Api.loadUserTournaments(fetch),
  };
};
