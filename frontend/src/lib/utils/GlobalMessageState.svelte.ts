export const globalMessages = $state({
  infos: [] as string[],
  errors: [] as string[],
  warnings: [] as string[],
});

// On the server this state is shared across requests, leaving it unsafe to write to directly.
// Server-side code (API calls made from load functions) must use these helpers rather than writing
// to globalMessages directly.
// Messages raised on the server are dropped, but loads rerun in the browser during hydration.
function canWrite(): boolean {
  return typeof window !== "undefined";
}

export function addError(message: string) {
  if (canWrite()) {
    globalMessages.errors.push(message);
  }
}

export function setErrors(messages: string[]) {
  if (canWrite()) {
    globalMessages.errors = messages;
  }
}

export function setWarnings(messages: string[]) {
  if (canWrite()) {
    globalMessages.warnings = messages;
  }
}
