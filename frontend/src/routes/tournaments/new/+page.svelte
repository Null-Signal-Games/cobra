<script lang="ts">
  import type { PageProps } from "./$types";
  import TournamentSettingsForm from "../TournamentSettingsForm.svelte";
  import type { Tournament } from "$lib/model/Tournament";
  import { type Errors, ValidationError } from "$lib/utils/errors";
  import { createTournament } from "$lib/api/classic";
  import { navigateTo } from "$lib/utils/navigation";

  let { data }: PageProps = $props();

  let errors = $state<Errors>({});

  async function submitNewTournament(tournament: Tournament) {
    errors = {};

    try {
      const response = await createTournament(tournament);
      navigateTo(response.url);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors = error.errors;
      } else {
        errors = { base: ["An unexpected error occurred. Please try again."] };
      }
      errors =
        error instanceof ValidationError
          ? error.errors
          : { base: ["An unexpected error occurred. Please try again."] };

      return false;
    }

    return true;
  }
</script>

<div>
  <h1>Create a tournament</h1>

  {#if errors.base}
    <div class="alert alert-danger">{errors.base}</div>
  {:else if data.tournamentSettings.tournament}
    <TournamentSettingsForm
      tournament={data.tournamentSettings.tournament}
      options={data.tournamentSettings.options}
      featureFlags={data.tournamentSettings.feature_flags}
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
