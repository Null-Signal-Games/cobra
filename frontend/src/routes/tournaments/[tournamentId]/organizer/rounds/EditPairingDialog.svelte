<script lang="ts">
  import FontAwesomeIcon from "#lib/components/FontAwesomeIcon.svelte";
  import ModalDialog from "#lib/components/ModalDialog.svelte";
  import type { Pairing } from "#lib/model/Pairing.ts";
  import { Player } from "#lib/model/Player.ts";
  import { readableReportScore, type ScoreReport } from "#lib/model/ScoreReport.ts";

  let {
    id,
    pairing,
    is_single_sided,
    reportScoreCallback,
    resetReportsCallback,
  }: {
    id: string;
    pairing: Pairing;
    is_single_sided: boolean;
    reportScoreCallback?: (
      pairingId: number,
      report: ScoreReport,
      selfReport: boolean,
    ) => void;
    resetReportsCallback?: (pairingId: number) => void;
  } = $props();

  let leftPlayer = $derived(
    is_single_sided && pairing.player2.side == "corp"
      ? pairing.player2
      : pairing.player1,
  );
  let rightPlayer = $derived(
    is_single_sided && pairing.player2.side == "corp"
      ? pairing.player1
      : pairing.player2,
  );
  let leftPlayerReport = $derived(
    pairing.self_reports?.find(
      (r) => r.report_player_id === leftPlayer.user_id,
    ),
  );
  let rightPlayerReport = $derived(
    pairing.self_reports?.find(
      (r) => r.report_player_id === rightPlayer.user_id,
    ),
  );
  let playersReported = $derived(
    leftPlayerReport !== undefined && rightPlayerReport !== undefined,
  );
  let selfReportsMatch = $derived(
    leftPlayerReport?.score1 === rightPlayerReport?.score1 &&
      leftPlayerReport?.score2 === rightPlayerReport?.score2 &&
      leftPlayerReport?.score1_corp === rightPlayerReport?.score1_corp &&
      leftPlayerReport?.score2_corp === rightPlayerReport?.score2_corp &&
      leftPlayerReport?.score1_runner === rightPlayerReport?.score1_runner &&
      leftPlayerReport?.score2_runner === rightPlayerReport?.score2_runner,
  );
</script>

{#snippet playerReport(player: Player, report: ScoreReport | undefined)}
  {player.name} reported:
  {#if report}
    {readableReportScore(report, pairing.player1.side, is_single_sided)}
    {#if playersReported && !selfReportsMatch}
      <FontAwesomeIcon icon="times" />
    {/if}
  {:else}
    <FontAwesomeIcon icon="hourglass" />
  {/if}
{/snippet}

{#snippet acceptPlayerReportButton(player: Player, report: ScoreReport)}
    <button
      type="button"
      class="btn btn-primary"
      data-dismiss="modal"
      onclick={() => {
        reportScoreCallback?.(pairing.id, report, false);
      }}
      disabled={pairing.reported}
    >
      <FontAwesomeIcon icon="check" /> Accept {player.name}
    </button>
  {/snippet}

<ModalDialog id={id} headerText="Player Self Reports">
  <p>
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
    {@render playerReport(leftPlayer, leftPlayerReport)}
  </p>
  <p>
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
    {@render playerReport(rightPlayer, rightPlayerReport)}
  </p>

  {#snippet footer()}
    {#if leftPlayerReport}
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render acceptPlayerReportButton(leftPlayer, leftPlayerReport)}
    {/if}
    {#if rightPlayerReport}
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render acceptPlayerReportButton(rightPlayer, rightPlayerReport)}
    {/if}
    {#if playersReported && !selfReportsMatch}
      <button
        type="button"
        class="btn btn-primary"
        onclick={() => {
          resetReportsCallback?.(pairing.id);
        }}
        title="Reset self reports of pairing"
      >
        <FontAwesomeIcon icon="undo" /> Reset
      </button>
    {/if}
  {/snippet}
</ModalDialog>
