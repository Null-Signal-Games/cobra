<script lang="ts">
  import { onMount } from "svelte";
  import type { TournamentInfo } from "$lib/api/v1ApiTypes";
  import TournamentRow from "$lib/components/TournamentRow.svelte";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { v1Api } from "$lib/api/v1";

  let tournaments: TournamentInfo[] = $state([]);
  let tournamentTypes: Record<string, string> = $state({});
  let loading = $state(true);

  async function fetchTodayTournaments(): Promise<void> {
    loading = true;
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const url = `/api/v1/public/tournaments?page[size]=100&include=tournament_type&filter[date]=${dateString}&sort=name`;

    try {
      const data = await v1Api.loadTournaments(url);
      tournaments = data.data;

      if (data.included) {
        let newTypes: Record<string, string> = {};
        for (const included of data.included) {
          if (included.type === "tournament_types") {
            newTypes[included.id] = included.attributes.name;
          }
        }
        tournamentTypes = newTypes;
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void fetchTodayTournaments();
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const cleanCode = (formData.get("shortcode") as string).trim().toUpperCase();
    if (cleanCode) {
      await goto(resolve(`/${cleanCode}`));
    }
  }
</script>

<div>
  <GlobalMessages />

  <h4>Today's tournaments</h4>
  {#if loading}
    <LoadingSpinner />
  {:else if tournaments.length === 0}
    <i>None</i>
  {:else}
    {#each tournaments as tournament (tournament.id)}
      <TournamentRow
        {tournament}
        tournamentTypeName={tournament.attributes.tournament_type_id
          ? tournamentTypes[tournament.attributes.tournament_type_id.toString()]
          : undefined}
      />
    {/each}
  {/if}
</div>

<div class="mt-2">
  <form method="get" class="form-inline justify-content-center" onsubmit={handleSubmit}>
    <label class="mx-2" for="shortcode">Got a shortcode?</label>
    <input
      type="text"
      class="form-control mr-2"
      placeholder="SHRT"
      name="shortcode"
      id="shortcode"
    />
    <button type="submit" class="btn btn-primary mr-2">
      <i class="fa fa-arrow-right"></i>
      Go to tournament
    </button>
  </form>
</div>

<div class="mt-3 text-center">
  <p>
    <a href={resolve("/tournaments")} class="btn btn-primary">
      <i class="fa fa-users"></i>
      More tournaments
    </a>
  </p>
</div>
