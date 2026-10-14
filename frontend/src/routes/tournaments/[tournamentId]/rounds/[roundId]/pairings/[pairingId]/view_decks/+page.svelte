<script lang="ts">
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import type { PageProps } from "./$types";

  let { data, params }: PageProps = $props();
</script>

<div class="col-12">
  <h3>{data.stageName}</h3>
  <h4>Round {params.roundId}, {data.tableLabel}</h4>

  <!-- TODO: Don't display edit deck link -->
  <div class="row">
    <div class="col-md-6">
      <DeckDisplay deck={data.corpPlayerDeck} title={data.corpPlayer.name} editMode={false} />
    </div>

    <div class="col-md-6">
      <DeckDisplay deck={data.runnerPlayerDeck} title={data.runnerPlayer.name} editMode={false} />
    </div>
  </div>
</div>
