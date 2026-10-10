<script lang="ts">
  import { onMount } from "svelte";
  import { classicApi } from "$lib/api/classic";
  import type { DemoTournamentSettings } from "$lib/api/classicTypes";
  import { type Errors, ValidationError } from "$lib/utils/errors";
  import { navigateTo } from "$lib/utils/navigation";
  import DemoTournamentSettingsForm from "./DemoTournamentSettingsForm.svelte";

  let tournament = $state<DemoTournamentSettings | undefined>(undefined);
  let csrfToken = "";
  let errors = $state<Errors>({});

  onMount(async () => {
    const data = await classicApi.loadNewDemoTournament();
    tournament = data.tournament;
    csrfToken = data.csrf_token;
  });

  async function submitNewTournament(tournament: DemoTournamentSettings) {
    errors = {};

    try {
      const response = await classicApi.createDemoTournament(tournament, csrfToken);
      navigateTo(response.url);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors = error.errors;
      } else {
        errors = { base: ["An unexpected error occurred. Please try again."] };
      }

      return false;
    }

    return true;
  }
</script>

<div class="row">
  <div class="col-12">
    <h1>Create a demo tournament</h1>
    <p>
      This allows you to create a private tournament with certain parameters,
      demo players with fake names, and specific rounds.
    </p>

    {#if errors.base}
      <div class="alert alert-danger">{errors.base}</div>
    {:else if tournament}
      <DemoTournamentSettingsForm
        {tournament}
        onSubmitCallback={submitNewTournament}
        submitLabel="Create"
        submitIcon="plus"
        {errors}
      />
    {:else}
      <div class="d-flex align-items-center m-2" data-testid="loading-spinner">
        <div class="spinner-border m-auto"></div>
      </div>
    {/if}
  </div>
</div>
