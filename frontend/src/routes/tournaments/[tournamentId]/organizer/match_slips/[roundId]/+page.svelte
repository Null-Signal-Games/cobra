<script lang="ts">
  import "#lib/assets/css/pairings.sass";
  import { resolve } from "$app/paths";
  import FontAwesomeIcon from "#lib/components/FontAwesomeIcon.svelte";
  import type { PageProps } from "./$types";
  import { getProcessedPairings } from "./collate.ts";

  let { data, params }: PageProps = $props();

  let blank = $state(true);
  let collated = $state(false);
  let showByes = $state(false);

  let displayPairings = $derived(getProcessedPairings(data.round?.pairings ?? [], collated, showByes));
</script>

<div class="col-12">
  <p class="dontprint">
    <a href={resolve(`tournaments/${params.tournamentId}/organizer/rounds`)} class="btn btn-primary">
      <FontAwesomeIcon icon="arrow-left" /> Back to Pairings
    </a>
    <button type="button" class="btn btn-primary" onclick={() => blank = !blank}>
      {#if blank}
        <FontAwesomeIcon icon="users" />
        Pre-populated
      {:else}
        <FontAwesomeIcon icon="users-slash" />
        Blank
      {/if}
    </button>
    <button type="button" class="btn btn-primary" onclick={() => collated = !collated}>
      <FontAwesomeIcon icon="flag-checkered" />
      {collated ? "Uncollate" : "Collate"}
    </button>
    <button
      type="button"
      class="btn btn-primary"
      onclick={() => showByes = !showByes}
    >
      {#if showByes}
        <FontAwesomeIcon icon="eye-slash" /> Hide byes
      {:else}
        <FontAwesomeIcon icon="eye" /> Show byes
      {/if}
    </button>
    <button
      type="button"
      class="btn btn-primary float-right"
      title="Print"
      onclick={() => {
        window.print();
      }}
    >
      <FontAwesomeIcon icon="print" />
      Print
    </button>
  </p>
  
  {#if data.round}
    <h2 class="dontprint">Round {data.round.number} Match Slips</h2>
  
    <div class="slips">
      {#each displayPairings as pairing (pairing.id)}
        <hr />

        <div class="match_slip">
          {#if blank}
            <h4>Round ____ - Table ____</h4>
          {:else}
            <h4>Round {data.round.number} - Table {pairing.table_number}</h4>
          {/if}

          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Name</th>
                <th style="width: 10%">Wins</th>
                <th style="width: 10%">Draws</th>
                <th style="width: 10%">Initials</th>
                <th style="width: 10%">Drop?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {#if blank}
                    &nbsp;
                  {:else}
                    {pairing.player1.name_with_pronouns || pairing.player1.name}
                  {/if}
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>
                  {#if blank}
                    &nbsp;
                  {:else}
                    {pairing.player2.name_with_pronouns || pairing.player2.name}
                  {/if}
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
  
          <p>
            Indicate how many wins, timed wins, and draws were earned by each player. Then initial to
            confirm. Tick "Drop?" if you would like to drop.
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="alert alert-warning">Round not found.</div>
  {/if}
</div>
