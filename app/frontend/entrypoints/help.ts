import { mount } from "svelte";
import HelpPage from "$frontendlib/components/HelpPage.svelte";

document.addEventListener("turbolinks:load", () => {
  const anchor = document.getElementById("help_anchor");
  if (anchor?.childNodes.length === 0) {
    mount(HelpPage, {
      target: anchor,
      props: {},
    });
  }
});
