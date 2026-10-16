<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import type { PageProps } from "./$types";
  import { getBackDetails } from "$lib/utils/navigation";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";

  let { data, params }: PageProps = $props();

  let backDetails = $derived(
    getBackDetails(page.url.searchParams.get("back_to"), params.tournamentId)
  );
</script>

<div class="col-12">
  <p class="dontprint">
    <a href={resolve(backDetails.path)} class="btn btn-primary">
      <FontAwesomeIcon icon="arrow-left" />
      {backDetails.label}
    </a>
  </p>

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
