<script lang="ts">
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import { Deck } from "$lib/model/Deck";
    import { sortCards } from "$lib/utils/decks.svelte";
  import type { PageProps } from "./$types";

  let { data, params }: PageProps = $props();

  let player1Deck = $derived.by(() => {
    const deck = data.player1Decks.find((d) => d.details.side_id === data.pairing?.player1.side) ?? new Deck();
    sortCards(deck.cards);
    return deck;
  });
  let player2Deck = $derived.by(() => {
    const deck = data.player2Decks.find((d) => d.details.side_id === data.pairing?.player2.side) ?? new Deck();
    sortCards(deck.cards);
    return deck;
  });
</script>

<div class="col-12">
  {#if data.pairing}
    <h3>{data.stageName}</h3>
    <h4>Round {params.roundId}, {data.pairing.table_label}</h4>

    {#if data.tournamentData.tournament.swiss_format === "single_sided"}
      <!-- TODO: Don't display edit deck link -->
      <div class="row">
        <div class="col-md-6">
          <DeckDisplay deck={player1Deck} title={data.pairing.player1.name} editMode={false} />
        </div>

        <div class="col-md-6">
          <DeckDisplay deck={player2Deck} title={data.pairing.player2.name} editMode={false} />
        </div>
      </div>
    {:else}
      <!-- TODO: Double-sided -->
    {/if}
  {:else}
    No pairing found.
  {/if}
</div>
