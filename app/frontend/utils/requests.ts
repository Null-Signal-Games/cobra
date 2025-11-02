export function redirectRequest(
  e: MouseEvent,
  url: string,
  method: string,
  csrfToken: string,
) {
  e.preventDefault();

  void fetch(url, {
    method: method,
    headers: { "X-CSRF-Token": csrfToken },
  }).then((response) => {
    if (response.redirected) {
      window.location.href = response.url;
    }
  });
}
