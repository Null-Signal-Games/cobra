import type { HandleFetch } from "@sveltejs/kit";
import { SERVER_COBRA_API_ENDPOINT } from "$app/env/private";

// Handle fetch requests differently when they are server-side:
// https://svelte.dev/docs/kit/hooks#handleFetch
export const handleFetch: HandleFetch = async ({ request, fetch }) => {
  if (SERVER_COBRA_API_ENDPOINT) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/beta/")) {
      request = new Request(new URL(url.pathname + url.search, SERVER_COBRA_API_ENDPOINT), request);
    }
  }

  return fetch(request);
};
