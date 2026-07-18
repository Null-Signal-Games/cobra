<script lang="ts">
  import { COBRA_API_SERVER } from '$app/env/public';
  import { onMount } from "svelte";
  import type { TournamentInfo, TournamentsResponse } from "$lib/utils/api_types";
  import TournamentRow from "$lib/components/TournamentRow.svelte";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

  let tournaments: TournamentInfo[] = $state([]);
  let tournamentTypes: Record<string, string> = $state({});
  let loading = $state(true);

  async function loadTournaments(): Promise<void> {
    loading = true;
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const url = `${COBRA_API_SERVER}/api/v1/public/tournaments?page[size]=100&include=tournament_type&filter[date]=${dateString}&sort=name`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = (await response.json()) as TournamentsResponse;
      tournaments = data.data;

      if (data.included) {
        let newTypes: Record<string, string> = {};
        for (const included of data.included) {
          if (included.type === "tournament_types") {
            newTypes[included.id.toString()] = included.attributes.name;
          }
        }
        tournamentTypes = newTypes;
      }
    } catch (e) {
      const err = e as Error;
      globalMessages.errors.push(`Failed to load tournaments: ${err.message}`);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadTournaments();
  });
</script>

<div>
  <GlobalMessages />

  <h4>Today's tournaments</h4>
  {#if loading}
    <div>Loading...</div>
  {:else if tournaments.length === 0}
    <i>None</i>
  {:else}
    {#each tournaments as tournament (tournament.id)}
      <TournamentRow
        showDelete={false}
        {tournament}
        userId={null}
        tournamentTypeName={tournament.attributes.tournament_type_id
          ? tournamentTypes[tournament.attributes.tournament_type_id.toString()]
          : null}
      />
    {/each}
  {/if}
</div>

<div class="mt-2">
  <!-- TODO: Add route for shortcode lookup -->
  <form
    action="/tournaments/shortlink"
    method="get"
    class="form-inline justify-content-center"
  >
    <label class="mx-2" for="slug">Got a shortcode?</label>
    <input
      type="text"
      class="form-control mr-2"
      placeholder="SHRT"
      name="slug"
      id="slug"
    />
    <button type="submit" class="btn btn-primary mr-2">
      <i class="fa fa-arrow-right"></i>
      Go to tournament
    </button>
  </form>
</div>

<div class="mt-3 text-center">
  <p>
    <!-- TODO: Add route for recent tournaments page -->
    <a href="/beta/tournaments" class="btn btn-primary">
      <i class="fa fa-users"></i>
      More tournaments
    </a>
  </p>
</div>
