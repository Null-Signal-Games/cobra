<script lang="ts">
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="col-12">
  <!-- TODO: Back button (see BackDetails and getBackDetails() in pairings.ts) -->
  
  <h3>{data.playerName}</h3>

  <!-- TODO: Don't display edit deck link -->
  <div class="row">
    <div class="col-md-6">
      <DeckDisplay deck={data.corpDeck} title="Corp Deck" editMode={false} />
    </div>

    <div class="col-md-6">
      <DeckDisplay deck={data.runnerDeck} title="Runner Deck" editMode={false} />
    </div>
  </div>
</div>
