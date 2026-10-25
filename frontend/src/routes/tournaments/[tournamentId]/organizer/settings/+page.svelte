<script lang="ts">
  import type { PageProps } from "./$types";
  import TournamentSettingsForm from "../../../TournamentSettingsForm.svelte";
  import type { Tournament } from "$lib/model/Tournament";
  import { type Errors, ValidationError } from "$lib/utils/errors";
  import { classicApi } from "$lib/api/classic";
  import { invalidateAll } from "$app/navigation";
  import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
  import { downloadBlob } from "$lib/utils/files";
  let { data }: PageProps = $props();
  let errors = $state<Errors>({});

  async function handleSave(tournamentEdit: Tournament): Promise<boolean> {
    errors = {};
    try {
      await classicApi.updateTournamentSettings(tournamentEdit);
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

  async function uploadToAbr(tournament: Tournament): Promise<boolean> {
    errors = {};
    try {
      const response = await classicApi.uploadToAbr(tournament.id);
      globalMessages.infos = [`Uploaded to Always Be Running with code ${response.abr_code}.`];
      await invalidateAll();
      return true;
    } catch (error) {
      errors = {
        base: [error instanceof Error ? error.message : "Upload to Always Be Running failed."],
      };
      return false;
    }
  }

  async function downloadJson(tournament: Tournament): Promise<boolean> {
    errors = {};
    try {
      const results = await classicApi.loadNrtmJson(tournament.id);
      downloadBlob(
        `${tournament.name}.json`,
        new Blob([JSON.stringify(results)], { type: "application/json" }),
      );
      return true;
    } catch (error) {
      errors = {
        base: [error instanceof Error ? error.message : "Failed to download tournament results."],
      };
      return false;
    }
  }
</script>

<div class="col-12">
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
        onUploadToAbr={uploadToAbr}
        onDownloadJson={downloadJson}
      />
    {/key}
  {:else}
    <div class="d-flex align-items-center m-2">
      <div class="spinner-border m-auto"></div>
    </div>
  {/if}
</div>
