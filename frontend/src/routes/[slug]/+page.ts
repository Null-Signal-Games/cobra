import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { v1Api } from "$lib/api/v1";

export const load: PageLoad = async ({ params, fetch }) => {
  const res = await v1Api.loadTournamentBySlug(params.slug, fetch);
  if (res.data.length === 1) {
    // Found: redirect to the tournament page
    redirect(302, `/tournaments/${res.data[0].id}`);
  }
  // Not found: redirect to not_found page with code param
  redirect(302, `/tournaments/not_found?code=${params.slug}`);
};
