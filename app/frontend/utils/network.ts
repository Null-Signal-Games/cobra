export interface StandardResponse {
  url?: string;
  error?: string;
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

  const standardResponse = (await response.json()) as StandardResponse;
  
  if (!response.ok) {
    throw new Error(standardResponse.error
      ?? `HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  if (standardResponse.url) {
    window.location.href = standardResponse.url;
  }
}
