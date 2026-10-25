import type { Handle, HandleFetch } from "@sveltejs/kit";
import { SERVER_COBRA_API_ENDPOINT } from "$app/env/private";

// Keep shared caches (nginx, CDNs) from storing pages rendered for a logged-in user.
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  if (event.cookies.get("_cobra_session")) {
    response.headers.set("cache-control", "private, no-store");
  }
  response.headers.append("vary", "Cookie");

  return response;
};

// Handle fetch requests differently when they are server-side:
// https://svelte.dev/docs/kit/hooks#handleFetch
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (SERVER_COBRA_API_ENDPOINT) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/beta/")) {
      request = new Request(new URL(url.pathname + url.search, SERVER_COBRA_API_ENDPOINT), request);

      // SvelteKit only forwards cookies to its own origin, and the rewritten URL is an internal
      // host, so pass the user's session along to the API explicitly.
      const cookie = event.request.headers.get("cookie");
      if (cookie && request.credentials !== "omit") {
        request.headers.set("cookie", cookie);
      }
    }
  }

  return fetch(request);
};
