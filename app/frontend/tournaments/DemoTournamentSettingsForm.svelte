<script lang="ts">
  import {
    type DemoTournamentSettings,
    type Errors,
  } from "./DemoTournamentSettings";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import ProgressButton from "../widgets/ProgressButton.svelte";
  import { swissFormatDisplayString } from "./TournamentSettings";

  let {
    tournament,
    submitLabel = "Save",
    submitIcon = "floppy-o",
    errors = {},
    onSubmitCallback,
  }: {
    tournament: DemoTournamentSettings;
    submitLabel?: string;
    submitIcon?: string;
    errors?: Errors;
    onSubmitCallback?: (tournament: DemoTournamentSettings) => Promise<boolean>;
  } = $props();

  // svelte-ignore state_referenced_locally
  let tournamentEdit = $state($state.snapshot(tournament));
</script>

<div class="form-group">
  <label for="name"><abbr title="required">*</abbr> Tournament name</label>
  <input
    type="text"
    id="name"
    class="form-control"
    bind:value={tournamentEdit.name}
  />
  {#if errors.name}
    <div class="invalid-feedback d-block">{errors.name}</div>
  {/if}
</div>

<div class="form-group">
  <label for="swiss_format">Swiss format</label>
  <select
    id="swiss_format"
    class="form-control"
    bind:value={tournamentEdit.swiss_format}
  >
    <option value="double_sided">{swissFormatDisplayString("double_sided")}</option>
    <option value="single_sided">{swissFormatDisplayString("single_sided")}</option>
  </select>
  {#if errors.swiss_format}
    <div class="invalid-feedback d-block">{errors.swiss_format}</div>
  {/if}
</div>

<div class="row">
  <div class="col-md-6">
    <div class="form-group">
      <label for="num_players">Number of Players</label>
      <input
        type="text"
        id="num_players"
        class="form-control"
        bind:value={tournamentEdit.num_players}
      />
      {#if errors.num_players}
        <div class="invalid-feedback d-block">{errors.num_players}</div>
      {/if}
    </div>
  </div>
  <div class="col-md-6">
    <div class="form-group">
      <label for="num_first_round_byes">Number of First Round Byes</label>
      <input
        type="text"
        id="num_first_round_byes"
        class="form-control"
        bind:value={tournamentEdit.num_first_round_byes}
      />
      {#if errors.num_first_round_byes}
        <div class="invalid-feedback d-block">
          {errors.num_first_round_byes}
        </div>
      {/if}
    </div>
  </div>
</div>

<div class="form-check mb-3">
  <input
    type="checkbox"
    id="assign_ids"
    class="form-check-input"
    bind:checked={tournamentEdit.assign_ids}
  />
  <label for="assign_ids" class="form-check-label">
    Assign random IDs for players?
  </label>
</div>

<ProgressButton
  css="btn btn-primary"
  inProgressText="Saving"
  completeText="Saved"
  onclick={() => {
    return onSubmitCallback ? onSubmitCallback(tournamentEdit) : false;
  }}
>
  <FontAwesomeIcon icon={submitIcon} />
  {submitLabel}
</ProgressButton>
