<script lang="ts">
  import type {
    TournamentsResponse,
    TournamentTypeInfo,
  } from "$lib/utils/api_types";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import PagingRow from "$lib/components/PagingRow.svelte";
  import TournamentRow from "$lib/components/TournamentRow.svelte";
  import { COBRA_API_SERVER } from "$app/env/public";
  import { loadTournaments } from "$lib/api/v1";

  let {
    typeId = null,
    tournamentsResponse,
    tournamentTypes
  }: {
    typeId?: number | null,
    tournamentsResponse: TournamentsResponse,
    tournamentTypes: TournamentTypeInfo[]
  } = $props();

  let tournamentTypeName = $derived(getTournamentTypeName(typeId));
  let loading = $state(false);

  function getTournamentTypeName(typeId: number | null) {
    return tournamentTypes.find(
      (tournamentType) => tournamentType.id === typeId?.toString(),
    )?.attributes.name;
  }

  async function goToPreviousPage() {
    if (!tournamentsResponse.links?.prev || loading) {
      return;
    }

    loading = true;
    tournamentsResponse = await loadTournaments(`${COBRA_API_SERVER}/${tournamentsResponse.links.prev}`);
    loading = false;
  }

  async function goToNextPage() {
    if (!tournamentsResponse.links?.next || loading) {
      return;
    }

    loading = true;
    tournamentsResponse = await loadTournaments(`${COBRA_API_SERVER}/${tournamentsResponse.links.next}`);
    loading = false;
  }
</script>

<div>
  <GlobalMessages />

  <h1>
    {#if typeId}
      {#if tournamentTypeName}
        Tournaments: {tournamentTypeName}
      {:else}
        Tournaments
      {/if}
    {:else}
      Recent Tournaments
    {/if}
  </h1>

  <div>
    <PagingRow
      {loading}
      canGoBack={!!tournamentsResponse.links?.prev}
      canGoNext={!!tournamentsResponse.links?.next}
      onBack={goToPreviousPage}
      onNext={goToNextPage}
    />

    {#if tournamentsResponse.data.length === 0}
      <div class="m-3">No tournaments found for this type.</div>
    {:else}
      {#each tournamentsResponse.data as tournament (tournament.id)}
        <TournamentRow
          {tournament}
          tournamentTypeName={tournament.attributes.tournament_type_id
            ? getTournamentTypeName(tournament.attributes.tournament_type_id)
            : null}
        />
      {/each}
    {/if}

    <PagingRow
      {loading}
      canGoBack={!!tournamentsResponse.links?.prev}
      canGoNext={!!tournamentsResponse.links?.next}
      onBack={goToPreviousPage}
      onNext={goToNextPage}
    />
  </div>
</div>
