<script lang="ts">
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import { Deck } from "$lib/model/Deck";
  import type { PageProps } from "./$types";

  let { data, params }: PageProps = $props();

  let player1Deck = $derived(data.player1Decks.find((d) => d.details.side_id === data.pairing?.player1.side) ?? new Deck());
  let player2Deck = $derived(data.player2Decks.find((d) => d.details.side_id === data.pairing?.player2.side) ?? new Deck());
</script>

<div class="col-12">
  {#if data.pairing}
    <h3>{data.stageName}</h3>
    <h4>Round {params.roundId}, {data.pairing.table_label}</h4>

    {#if data.tournamentData.tournament.swiss_format === "single_sided"}
      <!-- TODO: Don't display edit deck link -->
      <!-- TODO: Don't display "Corp/Runner Deck" headers in DeckDisplay? -->
      <div class="row">
        <div class="col-md-6 text-center">
          <h5>{data.pairing.player1.name}</h5>
          <DeckDisplay deck={player1Deck} isCorp={player1Deck.details.side_id === "corp"} editMode={false} />
        </div>

        <div class="col-md-6 text-center">
          <h5>{data.pairing.player2.name}</h5>
          <DeckDisplay deck={player2Deck} isCorp={player2Deck.details.side_id === "corp"} editMode={false} />
        </div>
      </div>
    {:else}
      <!-- TODO: Double-sided -->
    {/if}
  {:else}
    No pairing found.
  {/if}
</div>
