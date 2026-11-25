<script lang="ts">
	import FontAwesomeIcon from '#lib/components/FontAwesomeIcon.svelte';
	import type { Stage } from '#lib/model/Stage.ts';
	import type { Round } from '#lib/model/Round.ts';
	import type { Pairing } from '#lib/model/Pairing.ts';
	import type { Tournament } from '#lib/model/Tournament.ts';
	import { isPreset, reportsMatch, type ScoreReport } from '#lib/model/ScoreReport.ts';
	import PlayerDisplay from '#lib/components/PlayerDisplay.svelte';
	import type { Player } from '#lib/model/Player.ts';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { authStore, type AuthUser } from '#lib/utils/auth.svelte.ts';
	import EditPairingDialog from './EditPairingDialog.svelte';
	import ScoreDisplay from '#lib/components/ScoreDisplay.svelte';

	let {
		tournament,
		stage,
		round,
		pairing,
		deleteCallback,
		changePlayerSideCallback,
		reportScoreCallback,
		resetReportsCallback
	}: {
		tournament: Tournament;
		stage: Stage;
		round: Round;
		pairing: Pairing;
		deleteCallback?: (pairingId: number) => void;
		changePlayerSideCallback?: (pairingId: number, side: string) => void;
		reportScoreCallback?: (pairingId: number, report: ScoreReport, selfReport: boolean) => void;
		resetReportsCallback?: (pairingId: number) => void;
	} = $props();

	let currentUser = $state<AuthUser | null>(null);
	let leftPlayer = $derived(
		stage.is_single_sided && pairing.player2.side == 'corp' ? pairing.player2 : pairing.player1
	);
	let rightPlayer = $derived(
		stage.is_single_sided && pairing.player2.side == 'corp' ? pairing.player1 : pairing.player2
	);

	function changePlayerSide(player: Player, side: string) {
		if (
			!changePlayerSideCallback ||
			!confirm(`Are you sure you want to switch ${player.name} to ${side}?`)
		) {
			return;
		}

		let adjSide = side;
		if (player !== pairing.player1) {
			adjSide = side === 'corp' ? 'runner' : 'corp';
		}

		changePlayerSideCallback(pairing.id, adjSide);
	}

	onMount(async () => {
		currentUser = await authStore.checkAuth();
	});
</script>

<div
	class="row m-1 round_pairing align-items-center table_{pairing.table_number} {pairing
		.ui_metadata.row_highlighted
		? 'current_user_row'
		: ''}"
>
	<!-- Table label -->
	<div class="col-sm-2 {pairing.ui_metadata.row_highlighted ? 'font-weight-bold' : ''}">
		{pairing.table_label}
		{#if tournament.allow_streaming_opt_out}
			{#if pairing.player1.include_in_stream && pairing.player2.include_in_stream}
				<span title="May be included in video coverage.">
					<FontAwesomeIcon icon="video-camera" cssClass="text-success" />
				</span>
			{:else if stage.is_elimination}
				<span
					title="One or both players request not to be included in video coverage, but were informed this may not be possible in the cut."
				>
					<FontAwesomeIcon icon="video-camera" cssClass="text-warning" />
				</span>
			{:else}
				<span title="One or both players request not to not be included in video coverage.">
					<FontAwesomeIcon icon="video-camera" cssClass="text-secondary" />
					<FontAwesomeIcon icon="ban" cssClass="text-danger" />
				</span>
			{/if}
		{/if}
	</div>

	<!-- Player 1 -->
	{#if stage.view_decks}
		{#if stage.is_single_sided}
			<a
				href={resolve(
					`tournaments/${tournament.id}/rounds/${round.id}/pairings/${pairing.id}/view_decks?back_to=${tournament.user_id === currentUser?.id ? 'pairings' : 'rounds'}`
				)}
			>
				<FontAwesomeIcon icon="eye" /> View decks
			</a>
		{/if}
	{/if}
	<div class="col-4 px-2">
		<PlayerDisplay
			player={leftPlayer}
			{pairing}
			left_or_right="left"
			is_single_sided={stage.is_single_sided}
			show_ids={!stage.is_single_sided || pairing.player1.side !== null}
		/>
	</div>

	<!-- Edit -->
	<div class="col-4 col-sm-2 centre_score px-2">
		<button
			type="button"
			class="btn btn-primary mr-2"
			data-toggle="modal"
			data-target="#reports{pairing.id}"
		>
			<FontAwesomeIcon icon="pencil" /> Edit
		</button>

		<!-- Player report status badges -->
		<div>
			<ScoreDisplay {pairing} />
		</div>
		{#if pairing.self_reports}
			<div>
				{#if !pairing.reported}
					{#if pairing.self_reports.length == 1}
						<div class="badge badge-warning">Partial</div>
					{:else if pairing.self_reports.length == 2 && !reportsMatch(pairing.self_reports[0], pairing.self_reports[1])}
						<div class="badge badge-warning">Mismatch</div>
					{/if}
				{/if}
				{#if (pairing.self_reports.length > 0 && !isPreset(stage, pairing.self_reports[0])) || (pairing.self_reports.length > 1 && !isPreset(stage, pairing.self_reports[1]))}
					<div class="badge badge-secondary">Custom</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Player 2 -->
	<div class="col-4 px-2">
		<PlayerDisplay
			player={rightPlayer}
			{pairing}
			left_or_right="right"
			is_single_sided={stage.is_single_sided}
			show_ids={!stage.is_single_sided || pairing.player2.side !== null}
		/>
	</div>

	<EditPairingDialog
		id="reports{pairing.id}"
		{pairing}
		{stage}
		self_reporting_enabled={tournament.allow_self_reporting}
		{reportScoreCallback}
		{resetReportsCallback}
		{changePlayerSide}
		{deleteCallback}
	/>
</div>
