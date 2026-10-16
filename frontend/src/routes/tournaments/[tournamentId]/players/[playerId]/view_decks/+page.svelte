<script lang="ts">
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import type { PageProps } from "./$types";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import { getBackDetails } from "$lib/utils/navigation";

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
