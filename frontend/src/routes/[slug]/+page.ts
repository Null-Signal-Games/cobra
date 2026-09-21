import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { loadTournamentBySlug } from "../tournaments/api_helper";

export const load: PageLoad = async ({ params, fetch }) => {
  const res = await loadTournamentBySlug(params.slug, fetch);
  if (res.data.length === 1) {
    // Found: redirect to the tournament page
    redirect(302, `/tournaments/${res.data[0].id}`);
  }
  // Not found: redirect to not_found page with code param
  redirect(302, `/tournaments/not_found?code=${params.slug}`);
};
