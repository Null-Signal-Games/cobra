<script lang="ts">
  import "$lib/assets/css/pairings.sass";
  import { resolve } from "$app/paths";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { PageProps } from "./$types";
  import { getProcessedPairings } from "./collate";

  let { data, params }: PageProps = $props();

  let collated = $state(false);

  let displayPairings = $derived(getProcessedPairings(data.round?.pairings ?? [], collated));

  function toggleCollated() {
    collated = !collated;
  }
</script>

<div class="col-12">

<p class="dontprint">
  <a href={resolve(`/tournaments/${params.tournamentId}/organizer/rounds`)} class="btn btn-primary">
    <FontAwesomeIcon icon="arrow-left" /> Back to Pairings
  </a>
  <button type="button" class="btn btn-primary" onclick={toggleCollated}>
    <FontAwesomeIcon icon="flag-checkered" />
    {collated ? "Uncollate" : "Collate"}
  </button>
</p>

{#if data.round}
  <h2 class="dontprint">Round {data.round.number} Match Slips</h2>

  <div class="slips">
    {#each displayPairings as pairing (pairing.id)}
      <hr />

      <div class="match_slip">
        <h4>Round {data.round.number} - Table {pairing.table_number}</h4>

        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Wins</th>
              <th>Timed Wins</th>
              <th>Draws</th>
              <th>Initials</th>
              <th>Drop?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{pairing.player1.name_with_pronouns || pairing.player1.name}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{pairing.player2.name_with_pronouns || pairing.player2.name}</td>
              <td></td>
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
