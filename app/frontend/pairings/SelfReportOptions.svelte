<script lang="ts">
  import { type Pairing, Player, type Round, type Stage } from "./PairingsData";
  import { onMount } from "svelte";
  import { type ScoreReport, scorePresets, selfReport } from "./SelfReport";
  import ModalDialog from "../widgets/ModalDialog.svelte";

  let {
    tournamentId,
    stage,
    round,
    pairing,
    csrfToken,
  }: {
    tournamentId: number;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    csrfToken: string;
  } = $props();

  let presets: ScoreReport[] = $state([]);
  let customReporting = $state(false);

  let score1 = $state(0);
  let score2 = $state(0);

  let left_player_number = $state(1);
  let left_player = $state(new Player());
  let right_player = $state(new Player());

  left_player = pairing.player1;
  right_player = pairing.player2;
  if (stage.is_single_sided) {
    if (pairing.player1.side === "runner") {
      left_player_number = 2;
      left_player = pairing.player2;
      right_player = pairing.player1;
    }
  }

  onMount(() => {
    presets = scorePresets(stage, pairing);
  });

  function onCustomReportClicked() {
    customReporting = !customReporting;
  }

  async function onSelfReportPresetClicked(data: ScoreReport) {
    let report = { ...data };
    report.score1 = null;
    report.score2 = null;

    const response = await selfReport(
      tournamentId,
      round.id,
      pairing.id,
      csrfToken,
      report,
    );
    if (!response.success) {
      alert(response.error);
      return;
    }
    // TODO: instead of reloading, maybe use result value
    window.location.reload();
  }

  async function onCustomSelfReportSubmit(score1: number, score2: number) {
    const response = await selfReport(
      tournamentId,
      round.id,
      pairing.id,
      csrfToken,
      {
        score1,
        score2,
        intentional_draw: false,
        score1_corp: null,
        score1_runner: null,
        score2_corp: null,
        score2_runner: null,
      },
    );
    if (!response.success) {
      alert(response.error);
      return;
    }
    // TODO: instead of reloading, maybe use result value
    window.location.reload();
  }
</script>

<button
  type="button"
  class="btn btn-primary"
  data-toggle="modal"
  data-target="#reportModal"
>
  Report Pairing
</button>

<ModalDialog id="reportModal" headerText="Report Pairing">
  <p>Please click the button for the result to report this pairing:</p>
  <p>
    {left_player.name_with_pronouns} vs. {right_player.name_with_pronouns}
  </p>
  <div style="gap: 20px;" class="d-flex flex-row w-100 justify-content-center">
    {#if !customReporting}
      {#each presets as preset, index (preset.label)}
        <button
          class="btn btn-primary"
          data-dismiss="modal"
          id="option-{index}"
          onclick={async () => {
            return onSelfReportPresetClicked(preset);
          }}
        >
          {preset.extra_self_report_label ?? preset.label}
        </button>
      {/each}
    {:else}
      {#if left_player_number === 1}
        <input
          type="text"
          id="name"
          style="width: 2.5em;"
          class="form-control"
          bind:value={score1}
        />
        <p>-</p>
        <input
          type="text"
          id="name"
          style="width: 2.5em;"
          class="form-control"
          bind:value={score2}
        />
      {:else}
        <input
          type="text"
          id="name"
          style="width: 2.5em;"
          class="form-control"
          bind:value={score2}
        />
        <p>-</p>
        <input
          type="text"
          id="name"
          style="width: 2.5em;"
          class="form-control"
          bind:value={score1}
        />
      {/if}
      <button
        class="btn btn-primary"
        data-dismiss="modal"
        id="option-custom"
        onclick={async () => {
          return onCustomSelfReportSubmit(score1, score2);
        }}
      >
        Submit
      </button>
    {/if}
    <button
      class="btn btn-primary"
      id="option-custom"
      onclick={onCustomReportClicked}
    >
      {customReporting ? "Presets" : "Custom"}
    </button>
  </div>
</ModalDialog>
