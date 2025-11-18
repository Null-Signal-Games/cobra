import { globalMessages } from "./GlobalMessageState.svelte";

export interface StandardResponse {
  url?: string;
  infos?: string[];
  warnings?: string[];
  errors?: string[];
}

export async function redirectRequest(
  url: string,
  method: string,
  csrfToken: string,
  body?: object
) {
  const response = await fetch(
    url,
    {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(body)
    }
  );

  const resp = (await response.json()) as StandardResponse;
  globalMessages.infos = resp.infos ?? [];
  globalMessages.warnings = resp.warnings ?? [];
  globalMessages.errors = resp.errors ?? [];

  if (!response.ok) {
    throw new Error(`HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  if (resp.url) {
    window.location.href = resp.url;
  }
}
