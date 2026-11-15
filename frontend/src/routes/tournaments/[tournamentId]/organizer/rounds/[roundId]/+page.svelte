<script lang="ts">
  import FontAwesomeIcon from '#lib/components/FontAwesomeIcon.svelte';
  import Pairing from '../Pairing.svelte';
  import type { PageProps } from "./$types";
  import type { NewPairing } from '#lib/model/Pairing.ts';
  import { goto, refreshAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { ScoreReport } from '#lib/model/ScoreReport.ts';
  import { betaApi } from "#lib/api/beta.ts";
  import ProgressButton from '#lib/components/ProgressButton.svelte';
  import Svelecte from "svelecte";
  import { globalMessages } from '#lib/utils/GlobalMessageState.svelte.ts';

  let { data, params }: PageProps = $props();

  let newPairing = $state<NewPairing>({
    table_number: null,
    player1_id: null,
    side: "player1_is_corp",
    player2_id: null,
  });
  let sortedUnpairedPlayers = $derived(
    (data.round.unpaired_players ?? []).toSorted((a, b) => a.name.localeCompare(b.name)),
  );
  // Each player list leaves out whoever is picked in the other one.
  let player1Options = $derived(
    (data.round.unpaired_players ?? []).filter((p) => p.id !== newPairing.player2_id),
  );
  let player2Options = $derived(
    (data.round.unpaired_players ?? []).filter((p) => p.id !== newPairing.player1_id),
  );
  const sideOptions = [
    { id: "player1_is_corp", name: "Corp" },
    { id: "player1_is_runner", name: "Runner" },
  ];
  // svelte-ignore state_referenced_locally
  let sosWeight = $state(data.round.weight);

  async function rePair() {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await betaApi.rePairRound(parseInt(params.tournamentId), parseInt(params.roundId));
    if (!success) {
      globalMessages.errors.push("Unable to re-pair the round.");
      return;
    }

    await refreshAll();
  }

  async function complete(completed: boolean) {
    if (data.round.pairings.length != data.round.pairings_reported &&
      !confirm(
        `${data.round.pairings.length - data.round.pairings_reported} pairings have not been reported. Are you sure you want to complete this round?`,
      )
    ) {
      return;
    }

    const success = await betaApi.completeRound(parseInt(params.tournamentId), parseInt(params.roundId), completed);
    if (!success) {
      globalMessages.errors.push("Unable to complete the round.");
      return;
    }

    await refreshAll();
  }

  async function deleteRound() {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await betaApi.deleteRound(parseInt(params.tournamentId), parseInt(params.roundId));
    if (!success) {
      globalMessages.errors.push("Unable to delete the round.");
      return;
    }

    await goto(resolve(`tournaments/${params.tournamentId}/organizer/rounds`), { refreshAll: true });
  }

  async function createPairing(e: SubmitEvent) {
    e.preventDefault();

    if (!newPairing.table_number) {
      alert("A table number is required");
      return;
    }

    const success = await betaApi.createPairing(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      {
        ...$state.snapshot(newPairing),
        // Sides only apply to single-sided stages, when the side field is shown.
        side: data.stage.is_single_sided ? newPairing.side : null,
      },
    );
    if (!success) {
      globalMessages.errors.push("Unable to create the pairing.");
      return;
    }

    newPairing.table_number = null;
    newPairing.player1_id = null;
    newPairing.side = "player1_is_corp";
    newPairing.player2_id = null;

    await refreshAll();
  }

  async function deletePairingCallback(pairingId: number) {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await betaApi.deletePairing(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId,
    );
    if (!success) {
      globalMessages.errors.push("Unable to delete the pairing.");
      return;
    }

    await refreshAll();
  }

  async function changePlayerSideCallback(pairingId: number, side: string) {
    const success = await betaApi.changePlayerSide(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId,
      side,
    );
    if (!success) {
      globalMessages.errors.push("Unable to change player sides.");
      return;
    }

    await refreshAll();
  }

  async function reportScoreCallback(pairingId: number, report: ScoreReport) {
    const success = await betaApi.reportScore(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId,
      report,
      false,
    );
    if (!success) {
      globalMessages.errors.push("Unable to submit the score report.");
      return;
    }

    await refreshAll();
  }

  async function resetReportsCallback(pairingId: number) {
    const success = await betaApi.resetReports(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      pairingId);
    if (!success) {
      globalMessages.errors.push("Unable to reset the score reports.");
      return;
    }

    await refreshAll();
  }

  async function saveSOSWeighting() {
    const success = await betaApi.saveSOSWeighting(
      parseInt(params.tournamentId),
      parseInt(params.roundId),
      sosWeight);
    if (!success) {
      globalMessages.errors.push("Unable to save the SOS weighting.");
      return false;
    }

    await refreshAll();

    return true;
  }
</script>

<div class="col-12">
  <h2>Round {data.round.number}</h2>

  <p>
    <a href={resolve(`tournaments/${params.tournamentId}/organizer/rounds`)} class="btn btn-primary">
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
      tournament={data.tournamentData.tournament}
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

  <h3 class="mt-2 col-12">
    Unpaired players
    {#if data.round.unpaired_players?.length}
      ({data.round.unpaired_players.length})
    {/if}
  </h3>
  <div class="col-12">
    {#if data.round.unpaired_players && data.round.unpaired_players.length !== 0}
      <div class="unpaired-players">
        {#each sortedUnpairedPlayers as player (player.id)}
          <span class="badge badge-secondary" class:dropped={player.active === false}>
            {player.name}{#if player.active === false}&nbsp;(Dropped){/if}
          </span>
        {/each}
      </div>
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
        <!-- An empty player is a bye -->
        <label class="sr-only" for="new_pairing_player1">New pairing player 1</label>
        <div class="mx-2 new-pairing-player">
          <Svelecte
            inputId="new_pairing_player1"
            placeholder="(Bye)"
            options={player1Options}
            valueField="id"
            labelField="name"
            clearable
            bind:value={newPairing.player1_id}
          />
        </div>
        {#if data.stage.is_single_sided}
          <label class="sr-only" for="new_pairing_side">New pairing player 1 side</label>
          <div class="mx-2 new-pairing-side">
            <Svelecte
              inputId="new_pairing_side"
              placeholder="Player 1 Side"
              options={sideOptions}
              valueField="id"
              labelField="name"
              searchable={false}
              clearable
              bind:value={newPairing.side}
            />
          </div>
        {/if}
        vs
        <label class="sr-only" for="new_pairing_player2">New pairing player 2</label>
        <div class="mx-2 new-pairing-player">
          <Svelecte
            inputId="new_pairing_player2"
            placeholder="(Bye)"
            options={player2Options}
            valueField="id"
            labelField="name"
            clearable
            bind:value={newPairing.player2_id}
          />
        </div>
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

<style>
  .unpaired-players {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 1.25rem;
  }

  /* Narrower on wider screens; full width on phones so names don't squeeze. */
  @media (min-width: 768px) {
    .unpaired-players {
      width: 80%;
    }
  }

  .unpaired-players .badge {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .unpaired-players .dropped {
    opacity: 0.6;
  }

  .new-pairing-player {
    min-width: 14rem;
  }

  .new-pairing-side {
    min-width: 10rem;
  }
</style>
