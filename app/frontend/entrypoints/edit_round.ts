import { mount } from "svelte";
import EditRound from "../pairings/EditRound.svelte";

document.addEventListener("turbolinks:load", function () {
  const anchor = document.getElementById("edit_round_anchor");
  if (anchor && anchor.childNodes.length == 0) {
    mount(EditRound, {
      target: anchor,
      props: {
        tournamentId: Number(anchor.getAttribute("data-tournament") ?? "") || -1,
        roundId: Number(anchor.getAttribute("data-round") ?? "") || -1
      },
    });
  }
});
