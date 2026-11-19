<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";
  import { classicApi } from "#lib/api/classic.ts";
  import type { DemoTournamentSettings } from "#lib/api/classicTypes.ts";
  import { type Errors, ValidationError } from "#lib/utils/errors.ts";
  import { navigateTo } from "#lib/utils/navigation.ts";
  import DemoTournamentSettingsForm from "./DemoTournamentSettingsForm.svelte";

  let { data }: PageProps = $props();

  let tournament = $state<DemoTournamentSettings | undefined>(undefined);
  let errors = $state<Errors>({});

  const canCreateDemo = $derived(data.user?.features.create_demo_tournaments === true);

  onMount(async () => {
    if (!canCreateDemo) {
      return;
    }

    try {
      const settings = await classicApi.loadNewDemoTournament();
      tournament = settings.tournament;
    } catch {
      errors = { base: ["Unable to load the demo tournament form. Please try again."] };
    }
  });

  async function submitNewTournament(tournament: DemoTournamentSettings) {
    errors = {};

    try {
      const response = await classicApi.createDemoTournament(tournament);
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

    {#if !data.user}
      <div class="alert alert-warning">You must be logged in to create a demo tournament.</div>
    {:else if !canCreateDemo}
      <div class="alert alert-warning">Demo tournaments are not enabled for your account.</div>
    {:else if errors.base}
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
