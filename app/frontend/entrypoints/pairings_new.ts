import { mount } from "svelte";
import Pairings from "../pairings/Pairings.svelte";

document.addEventListener("turbolinks:load", function () {
  const anchor = document.getElementById("pairings_new_anchor");
  if (anchor && anchor.childNodes.length === 0) {
    mount(Pairings, {
      target: anchor,
      props: {
        tournamentId:
          Number(anchor.getAttribute("data-tournament") ?? "") || -1,
      },
    });
  }
});
