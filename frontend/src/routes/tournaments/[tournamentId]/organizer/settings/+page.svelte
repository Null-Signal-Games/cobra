<script lang="ts">
  import type { PageProps } from "./$types";
  import TournamentSettingsForm from "../../../TournamentSettingsForm.svelte";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import type { Tournament } from "$lib/model/Tournament";
  import { type Errors, ValidationError } from "$lib/utils/errors";
  import { updateTournamentSettings } from "../../api_helper";
  import { invalidateAll } from "$app/navigation";
  import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
  let { data }: PageProps = $props();
  let errors = $state<Errors>({});

  async function handleSave(tournamentEdit: Tournament): Promise<boolean> {
    errors = {};
    try {
      await updateTournamentSettings(
        data.tournamentSettings.csrf_token,
        tournamentEdit,
      );
      globalMessages.infos = ["Tournament settings saved."];
      await invalidateAll();
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        errors = error.errors;
      } else {
        errors = { base: ["An unexpected error occurred. Please try again."] };
      }
      return false;
    }
  }
</script>

<div class="col-12">
    <GlobalMessages />
    
  {#if errors.base}
    <div class="alert alert-danger">{errors.base}</div>
  {/if}
  {#if data.tournamentSettings}
    {#key data.tournamentSettings.tournament.updated_at}
      <TournamentSettingsForm
        tournament={data.tournamentSettings.tournament}
        options={data.tournamentSettings.options}
        featureFlags={data.tournamentSettings.feature_flags}
        canChangeSwissFormat={data.tournamentSettings.can_change_swiss_format ?? true}
        submitLabel="Save"
        submitIcon="save"
        {errors}
        onSubmitCallback={handleSave}
      />
    {/key}
  {:else}
    <div class="d-flex align-items-center m-2">
      <div class="spinner-border m-auto"></div>
    </div>
  {/if}
</div>
