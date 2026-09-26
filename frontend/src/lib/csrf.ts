export function csrfToken() {
  return typeof document !== "undefined"
    ? (document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") ?? "")
    : "";
}
