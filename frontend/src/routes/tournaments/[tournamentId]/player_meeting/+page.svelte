<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { PageProps } from "./$types";
  import { createPlayerMeetingPairings, getBackDetails } from "./pairings";

  let { data, params }: PageProps = $props();

  let pairings = $derived(createPlayerMeetingPairings(data.players.activePlayers));

  let backTo = $derived(data.back_to ?? page.url.searchParams.get("back_to"));
  let backDetails = $derived(getBackDetails(backTo, params.tournamentId));
  let backHref = $derived(resolve(backDetails.path));
  let backLabel = $derived(backDetails.label);
</script>

<div class="col-12">
  <p class="dontprint">
    <a href={backHref} class="btn btn-primary">
      <FontAwesomeIcon icon="arrow-left" />
      {backLabel}
    </a>
  </p>

  <h3>Player meeting</h3>

  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Player 1</th>
        <th>Player 2</th>
      </tr>
    </thead>
    <tbody>
      {#each pairings as pairing, i (i)}
        <tr>
          <td>{i + 1}</td>
          <td>{pairing[0].name}</td>
          <td>{pairing[1]?.name ?? ""}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
