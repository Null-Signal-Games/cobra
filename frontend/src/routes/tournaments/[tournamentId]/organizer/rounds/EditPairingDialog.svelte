<script lang="ts">
	import FontAwesomeIcon from '#lib/components/FontAwesomeIcon.svelte';
	import ModalDialog from '#lib/components/ModalDialog.svelte';
	import type { Pairing } from '#lib/model/Pairing.ts';
	import { Player } from '#lib/model/Player.ts';
	import { readableReportScore, type ScoreReport } from '#lib/model/ScoreReport.ts';
	import type { Stage } from '#lib/model/Stage.ts';
	import AdminReportOptions from './AdminReportOptions.svelte';

	let {
		id,
		pairing,
		stage,
		self_reporting_enabled,
		reportScoreCallback,
		resetReportsCallback,
		changePlayerSide,
		deleteCallback
	}: {
		id: string;
		pairing: Pairing;
		stage: Stage;
		self_reporting_enabled: boolean;
		reportScoreCallback?: (pairingId: number, report: ScoreReport, selfReport: boolean) => void;
		resetReportsCallback?: (pairingId: number) => void;
		changePlayerSide?: (player: Player, side: string) => void;
		deleteCallback?: (pairingId: number) => void;
	} = $props();

	let dialog = $state<ModalDialog>();

	let leftPlayer = $derived(
		stage.is_single_sided && pairing.player2.side == 'corp' ? pairing.player2 : pairing.player1
	);
	let rightPlayer = $derived(
		stage.is_single_sided && pairing.player2.side == 'corp' ? pairing.player1 : pairing.player2
	);
	let leftPlayerReport = $derived(
		pairing.self_reports?.find((r) => r.report_player_id === leftPlayer.user_id)
	);
	let rightPlayerReport = $derived(
		pairing.self_reports?.find((r) => r.report_player_id === rightPlayer.user_id)
	);
	let playersReported = $derived(
		leftPlayerReport !== undefined && rightPlayerReport !== undefined
	);
	let selfReportsMatch = $derived(
		leftPlayerReport?.score1 === rightPlayerReport?.score1 &&
			leftPlayerReport?.score2 === rightPlayerReport?.score2 &&
			leftPlayerReport?.score1_corp === rightPlayerReport?.score1_corp &&
			leftPlayerReport?.score2_corp === rightPlayerReport?.score2_corp &&
			leftPlayerReport?.score1_runner === rightPlayerReport?.score1_runner &&
			leftPlayerReport?.score2_runner === rightPlayerReport?.score2_runner
	);

	async function deletePairing() {
		if (!confirm('Are you sure? This cannot be reversed.')) {
			return;
		}

		deleteCallback?.(pairing.id);
		dialog?.close();
	}
</script>

{#snippet playerReportRow(player: Player, report: ScoreReport | undefined)}
	<div class="row mb-2 align-items-center">
		<div class="col-6">
			{player.name}
		</div>
		<div class="col-3">
			{#if report}
				{readableReportScore(report, pairing.player1.side, stage.is_single_sided)}
				{#if playersReported && !selfReportsMatch}
					<FontAwesomeIcon icon="times" />
				{/if}
			{:else}
				<FontAwesomeIcon icon="hourglass" />
			{/if}
		</div>
		<div class="col-3">
			<button
				type="button"
				class="btn btn-primary"
				data-dismiss="modal"
				onclick={() => {
					if (report) {
						reportScoreCallback?.(pairing.id, report, false);
					}
				}}
				disabled={!report || pairing.reported}
				aria-label={`accept ${player.name}`}
			>
				Accept
			</button>
		</div>
	</div>
{/snippet}

{#snippet setSideButton(player: Player, side: string)}
	<button
		class="btn btn-sm {player.side === side ? 'btn-secondary' : 'btn-outline-secondary'} w-100"
		onclick={() => {
			changePlayerSide?.(player, side);
		}}
		aria-label={`change ${player.name} to ${side}`}
	>
		{#if player.side === side}
			<FontAwesomeIcon icon="check" dataTestId="selected" />
		{/if}
		{side == 'corp' ? 'Corp' : 'Runner'}
	</button>
{/snippet}

<ModalDialog bind:this={dialog} {id} headerText="Table {pairing.table_number}">
	{#if self_reporting_enabled}
		<h5>Player Self Reports</h5>
		<div class="container">
			{@render playerReportRow(leftPlayer, leftPlayerReport)}
			{@render playerReportRow(rightPlayer, rightPlayerReport)}

			{#if playersReported && !selfReportsMatch}
				<div class="row mb-2 align-items-center">
					<div class="col-8">
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
					</div>
				</div>
			{/if}
		</div>

		<hr />
	{/if}

	<h5>Manual Score Reporting</h5>
	<AdminReportOptions {stage} {pairing} {reportScoreCallback} />
	<hr />

	{#if changePlayerSide && stage.is_single_sided && pairing.player1.id && pairing.player2.id}
		<h5>Change Player Sides</h5>
		<div class="container">
			<div class="row mb-2 align-items-center">
				<div class="col-6">{leftPlayer.name}:</div>
				<div class="col-3">{@render setSideButton(leftPlayer, 'corp')}</div>
				<div class="col-3">{@render setSideButton(leftPlayer, 'runner')}</div>
			</div>
			<div class="row mb-2 align-items-center">
				<div class="col-6">{rightPlayer.name}:</div>
				<div class="col-3">{@render setSideButton(rightPlayer, 'corp')}</div>
				<div class="col-3">{@render setSideButton(rightPlayer, 'runner')}</div>
			</div>
		</div>
		<hr />
	{/if}

	<h5>Danger Zone</h5>
	<button class="btn btn-danger" onclick={deletePairing} aria-label="delete">
		<FontAwesomeIcon icon="trash" /> Delete Pairing
	</button>
</ModalDialog>
