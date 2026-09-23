import type { PageLoad } from "../$types";

const icons = ['😢', '🤔', '🙃', '😣', '😱'];

// Disables server-side rendering for this page to disable flickering of the icon selection.
export const ssr = false;

export const load: PageLoad = ({ url }) => {
  const code = url.searchParams.get("code") ?? "";
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  return {
    code,
    icon: randomIcon
  };
};
