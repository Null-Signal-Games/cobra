<script lang="ts">
  import FontAwesomeIcon from '$lib/components/FontAwesomeIcon.svelte';
  import GlobalMessages from '$lib/components/GlobalMessages.svelte';
  import Pairing from '../Pairing.svelte';
  import type { PageProps } from "./$types";
  import type { NewPairing } from '$lib/model/Pairing';
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { ScoreReport } from '$lib/model/ScoreReport';
  import {
    changePlayerSide,
    completeRound,
    createPairing as createPairingRequest,
    deletePairing,
    deleteRound as deleteRoundRequest,
    rePairRound,
    reportScore,
    resetReports,
    saveSOSWeighting as saveSOSWeightingRequest,
  } from '../../../api_helper';
    import ProgressButton from '$lib/components/ProgressButton.svelte';

  let { data, params }: PageProps = $props();

  let newPairing = $state<NewPairing>({
    table_number: null,
    player1_id: 0,
    side: "",
    player2_id: 0,
  });
  // svelte-ignore state_referenced_locally
  let sosWeight = $state(data.round.weight);

  async function rePair() {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await rePairRound(parseInt(params.tournamentId), parseInt(params.roundId));
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await invalidateAll();
  }

  async function complete(completed: boolean) {
    if (data.round.pairings.length != data.round.pairings_reported &&
      !confirm(
        `${data.round.pairings.length - data.round.pairings_reported} pairings have not been reported. Are you sure you want to complete this round?`,
      )
    ) {
      return;
    }

    const success = await completeRound(parseInt(params.tournamentId), parseInt(params.roundId), completed);
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await invalidateAll();
  }

  async function deleteRound() {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await deleteRoundRequest(parseInt(params.tournamentId), parseInt(params.roundId));
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await goto(resolve(`/tournaments/${params.tournamentId}/organizer/rounds`));
  }

  async function createPairing(e: SubmitEvent) {
    e.preventDefault();

    if (!newPairing.table_number) {
      alert("A table number is required");
      return;
    }

    const success = await createPairingRequest(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      newPairing,
    );
    if (!success) {
      // TODO: Notify the user
      return;
    }

    newPairing.table_number = null;
    newPairing.player1_id = 0;
    newPairing.side = "";
    newPairing.player2_id = 0;

    await invalidateAll();
  }

  async function deletePairingCallback(pairingId: number) {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await deletePairing(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId,
    );
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await invalidateAll();
  }

  async function changePlayerSideCallback(pairingId: number, side: string) {
    const success = await changePlayerSide(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId,
      side,
    );
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await invalidateAll();
  }

  async function reportScoreCallback(pairingId: number, report: ScoreReport) {
    const success = await reportScore(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId,
      report,
      false,
    );
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await invalidateAll();
  }

  async function resetReportsCallback(pairingId: number) {
    const success = await resetReports(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId);
    if (!success) {
      // TODO: Notify the user
      return;
    }

    await invalidateAll();
  }

  async function saveSOSWeighting() {
    const success = await saveSOSWeightingRequest(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      sosWeight);
    if (!success) {
      // TODO: Notify the user
      return false;
    }

    await invalidateAll();

    return true;
  }
</script>

<div class="col-12">
  <GlobalMessages />

  <h2>Round {data.round.number}</h2>

  <p>
    <a href={resolve(`/tournaments/${params.tournamentId}/organizer/rounds`)} class="btn btn-primary">
      <FontAwesomeIcon icon="arrow-left" /> Back to pairings
    </a>

    <!-- Edit controls -->
    <button type="button" class="btn btn-warning" onclick={rePair}>
      <FontAwesomeIcon icon="refresh" /> Re-pair
    </button>
    {#if data.round.completed}
      <button
        type="button"
        class="btn btn-warning"
        onclick={async () => {
          await complete(false);
        }}
      >
        <FontAwesomeIcon icon="backward" /> Uncomplete
      </button>
    {:else}
      <button
        type="button"
        class="btn btn-warning"
        onclick={async () => {
          await complete(true);
        }}
      >
        <FontAwesomeIcon icon="check" /> Complete
      </button>
    {/if}
    <button type="button" class="btn btn-danger" onclick={deleteRound}>
      <FontAwesomeIcon icon="trash" /> Delete round
    </button>
  </p>

  <!-- Pairings -->
  {#each data.round.pairings as pairing (pairing.id)}
    <hr />
    <Pairing
      tournament={data.tournament}
      {pairing}
      round={data.round}
      stage={data.stage}
      deleteCallback={deletePairingCallback}
      {changePlayerSideCallback}
      {reportScoreCallback}
      {resetReportsCallback}
    />
  {/each}
  <hr />

  <h3 class="mt-2 col-12">Unpaired players</h3>
  <div class="col-12">
    {#if data.round.unpaired_players && data.round.unpaired_players.length !== 0}
      {#each data.round.unpaired_players as player (player.id)}
        <div>
          {player.name}
          {#if player.active === false}
            (Dropped)
          {/if}
        </div>
      {/each}  
      {#snippet playerOptions()}
        <option value="">(Bye)</option>
        {#each data.round.unpaired_players as player (player.id)}
          <option value={player.id}>{player.name}</option>
        {/each}
      {/snippet}  
      <h4 class="mt-2">Create pairing</h4>
      <form
        id="new_pairing"
        onsubmit={createPairing}
        class="form-inline col-12"
      >
        <input
          aria-label="New pairing table number"
          type="number"
          class="form-control"
          placeholder="Table number"
          bind:value={newPairing.table_number}
        />
        <select
          aria-label="New pairing player 1"
          class="form-control mx-2"
          bind:value={newPairing.player1_id}
        >
          <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
          {@render playerOptions()}
        </select>
        {#if data.stage.is_single_sided}
          <select
            aria-label="New pairing player 1 side"
            class="form-control mx-2"
            bind:value={newPairing.side}
          >
            <option value="">Player 1 Side</option>
            <option value="player1_is_corp">Corp</option>
            <option value="player1_is_runner">Runner</option>
          </select>
        {/if}
        vs
        <select
          aria-label="New pairing player 2"
          class="form-control mx-2"
          bind:value={newPairing.player2_id}
        >
          <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
          {@render playerOptions()}
        </select>
        <button type="submit" class="btn btn-success">
          <FontAwesomeIcon icon="plus" /> Create
        </button>
      </form>
    {:else}
      None
    {/if}
  </div>

  <h3 class="mt-2 col-12 mt-5">SOS Weighting</h3>
  <div class="col-12 form-inline">
    <input
      aria-label="SOS weighting"
      type="number"
      step="0.1"
      class="form-control mx-2"
      placeholder="Weight"
      bind:value={sosWeight}
    />
    <ProgressButton
      onclick={saveSOSWeighting}
      inProgressText="Saving SOS weight"
      completeText="Saved SOS weight"
      css="btn btn-success"
    >
      <FontAwesomeIcon icon="floppy-o" /> Save
    </ProgressButton>
  </div>
</div>
