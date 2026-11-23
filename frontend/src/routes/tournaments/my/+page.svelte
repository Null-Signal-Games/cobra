<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import { v1Api } from "#lib/api/v1.ts";
  import FontAwesomeIcon from "#lib/components/FontAwesomeIcon.svelte";
  import type { TournamentsResponse } from "#lib/api/v1ApiTypes.ts";
  import { authStore } from "#lib/utils/auth.svelte.ts";
  import PagingRow from "#lib/components/PagingRow.svelte";
  import TournamentRow from "#lib/components/TournamentRow.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let { user, tournamentTypes } = $derived(data);

  let tournamentsResponse = $state<TournamentsResponse>({ data: [], links: {} });
  let loading = $state(true);

  function getTournamentTypeName(typeId: number | null) {
    return tournamentTypes.find((tournamentType) => tournamentType.id === typeId?.toString())
      ?.attributes.name;
  }

  onMount(async () => {
    if (!user) {
      const currentUrl = window.location.origin + window.location.pathname;
      authStore.redirectToLogin(currentUrl);
      return;
    }

    try {
      tournamentsResponse = await v1Api.loadUserTournaments();
    } catch {
      // Ignore load error
    } finally {
      loading = false;
    }
  });

  async function goToPreviousPage() {
    if (!tournamentsResponse.links?.prev || loading) {
      return;
    }

    loading = true;
    tournamentsResponse = await v1Api.loadTournaments(tournamentsResponse.links.prev);
    loading = false;
  }

  async function goToNextPage() {
    if (!tournamentsResponse.links?.next || loading) {
      return;
    }

    loading = true;
    tournamentsResponse = await v1Api.loadTournaments(tournamentsResponse.links.next);
    loading = false;
  }
</script>

<div class="mt-4">
  {#if loading}
    <div class="d-flex justify-content-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only">Loading My Tournaments...</span>
      </div>
    </div>
  {:else if user}
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2>My Tournaments</h2>
        <p class="text-muted mb-0">Logged in as <strong>{user.nrdb_username}</strong></p>
      </div>
      <a href={resolve("tournaments/new")} class="btn btn-success">
        <FontAwesomeIcon icon="plus" /> New Tournament
      </a>
    </div>
    
    <PagingRow
      {loading}
      canGoBack={!!tournamentsResponse.links?.prev}
      canGoNext={!!tournamentsResponse.links?.next}
      onBack={goToPreviousPage}
      onNext={goToNextPage}
    />

    {#if tournamentsResponse.data.length === 0}
      <div class="m-3">You haven't created any tournaments yet.</div>
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

  {/if}
</div>
