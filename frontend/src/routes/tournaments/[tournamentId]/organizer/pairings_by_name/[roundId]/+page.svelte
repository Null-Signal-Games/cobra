<script lang="ts">
  import { resolve } from "$app/paths";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { PageProps } from "./$types";
  import { generatePairingsByName } from "./pairings_by_name";

  let { data, params }: PageProps = $props();

  let pairingsByName = $derived(
    data.round && data.stage
      ? generatePairingsByName(
          data.round.pairings,
          data.stage.format,
          data.stage.is_single_sided,
        )
      : [],
  );

  let backHref = $derived(
    resolve(`/tournaments/${params.tournamentId}/organizer/rounds`),
  );

  function handleBack(e: MouseEvent) {
    if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  }
</script>

<div class="col-12">
  <p class="dontprint">
    <a href={backHref} onclick={handleBack} class="btn btn-primary">
      <FontAwesomeIcon icon="arrow-left" /> Back to pairings
    </a>
  </p>

  {#if data.round && data.stage}
    <h3>Round {data.round.number} pairings</h3>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Table</th>
          {#if data.stage.view_decks}
            <th>Decks</th>
          {/if}
          <th>Player Name</th>
          <th>Opponent</th>
        </tr>
      </thead>
      <tbody>
        {#each pairingsByName as row, i (`${row.pairingId}-${row.playerName}-${i}`)}
          <tr>
            <td>{row.tableNumber}</td>
            {#if data.stage.view_decks}
              <td>
                <a
                  href={resolve(
                    `/tournaments/${params.tournamentId}/rounds/${data.round.id}/pairings/${row.pairingId}/view_decks?back_to=pairings`,
                  )}
                  class="ml-2"
                >
                  <FontAwesomeIcon icon="eye" /> View decks
                </a>
              </td>
            {/if}
            <td>{row.playerName}</td>
            <td>{row.opponentName}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="alert alert-warning">Round not found.</div>
  {/if}
</div>
