<script lang="ts">
  import { onMount, setContext } from "svelte";
  import Stage from "./Stage.svelte";
  import {
    completeRound,
    createStage,
    deletePairing,
    deleteStage,
    loadPairings,
    PairingsData,
    pairRound,
    setPlayerRegistrationStatus as setPlayerRegistrationStatusRequest,
    setRegistrationStatus as setRegistrationStatusRequest,
    updateRoundTimer,
    type PairingsContext,
  } from "./PairingsData";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { showIdentities } from "../utils/ShowIdentities";
  import GlobalMessages from "../widgets/GlobalMessages.svelte";
  import ModalDialog from "../widgets/ModalDialog.svelte";
  import { showReportedPairings } from "../utils/ShowReportedPairings";
  import {
    changePlayerSide,
    reportScore,
    type ScoreReport,
  } from "./SelfReport";

  let { tournamentId }: { tournamentId: number } = $props();

  let data = $state(new PairingsData());
  let forcePlayerView = $state(false);
  let ctx: PairingsContext = $state({ showOrganizerView: false });

  setContext("pairingsContext", ctx);

  onMount(async () => {
    data = await loadPairings(tournamentId);
    ctx.showOrganizerView = data.policy.update;
  });

  function toggleForcePlayerView() {
    forcePlayerView = !forcePlayerView;
    ctx.showOrganizerView = data.policy.update && !forcePlayerView;
  }

  async function addStage(cutSingleElim?: boolean, cutCount?: number) {
    const success = await createStage(tournamentId, cutSingleElim, cutCount);
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function pairNewRound() {
    if (
      data.tournament.registration_unlocked &&
      !confirm(
        "Registration is still open or some players are unlocked. Pair new round anyway?",
      )
    ) {
      return;
    }

    const success = await pairRound(tournamentId);
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function setRegistrationStatus(open: boolean) {
    const success = await setRegistrationStatusRequest(tournamentId, open);
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function setPlayerRegistrationStatus(open: boolean) {
    const success = await setPlayerRegistrationStatusRequest(
      tournamentId,
      open,
    );
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function deletePairingCallback(roundId: number, pairingId: number) {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    const success = await deletePairing(tournamentId, roundId, pairingId);
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function changePlayerSideCallback(
    roundId: number,
    pairingId: number,
    side: string,
  ) {
    const success = await changePlayerSide(
      tournamentId,
      roundId,
      pairingId,
      side,
    );
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function reportScoreCallback(
    roundId: number,
    pairingId: number,
    report: ScoreReport,
    selfReport: boolean,
  ) {
    const success = await reportScore(
      tournamentId,
      roundId,
      pairingId,
      report,
      selfReport,
    );
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function completeRoundCallback(roundId: number) {
    const success = await completeRound(tournamentId, roundId, true);
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function deleteStageCallback(stageId: number) {
    if (
      !confirm(
        "Are you sure? This cannot be reversed and all rounds will be deleted.",
      )
    ) {
      return;
    }

    const success = await deleteStage(tournamentId, stageId);
    if (!success) {
      return;
    }

    data = await loadPairings(tournamentId);
  }

  async function updateTimerCallback(
    roundId: number,
    length_minutes: number,
    operation: string,
  ) {
    if (
      operation === "reset" &&
      !confirm("This will clear all elapsed time in the round. Are you sure?")
    ) {
      return;
    }

    const success = await updateRoundTimer(
      tournamentId,
      roundId,
      length_minutes,
      operation,
    );
    if (!success) {
      return;
    }

    window.location.href = `/beta/tournaments/${tournamentId}/rounds`;
  }
</script>

<GlobalMessages />

<p></p>

{#if data}
  {#if data.stages.length == 0}
    <!-- Add Swiss stage button -->
    {#if ctx.showOrganizerView}
      <button
        type="button"
        class="btn btn-success"
        onclick={async () => {
          await addStage();
        }}
      >
        <FontAwesomeIcon icon="plus" /> Add Swiss stage
      </button>
    {/if}
  {:else}
    <!-- Upper controls -->
    <div>
      {#if data.tournament.player_meeting}
        <a
          href={`/tournaments/${tournamentId}/players/meeting?back_to=${ctx.showOrganizerView ? "pairings" : "view_pairings"}`}
          class="btn btn-primary"
        >
          <FontAwesomeIcon icon="list-ul" /> Player meeting
        </a>
      {:else}
        {#if ctx.showOrganizerView}
          <button
            type="button"
            class="btn btn-primary"
            onclick={() => {
              showReportedPairings.update((value) => !value);
            }}
          >
            <FontAwesomeIcon icon="eye-slash" /> Show/hide reported pairings
          </button>
        {/if}
        <button
          type="button"
          class="btn btn-primary"
          onclick={() => {
            showIdentities.update((value) => !value);
          }}
        >
          <FontAwesomeIcon icon="eye-slash" /> Show/hide identities
        </button>
        <button
          type="button"
          class="btn btn-info"
          data-toggle="modal"
          data-target="#faq"
        >
          <FontAwesomeIcon icon="question" /> FAQ
        </button>
        {#if data.policy.update}
          <button
            type="button"
            class="btn btn-primary float-right"
            onclick={toggleForcePlayerView}
          >
            {#if ctx.showOrganizerView}
              <FontAwesomeIcon icon="users" /> See player pairings view
            {:else}
              <FontAwesomeIcon icon="user" /> See organizer pairings view
            {/if}
          </button>
        {/if}

        {#if ctx.showOrganizerView && !$showReportedPairings}
          <div class="alert alert-info mt-3">
            Reported scores are currently hidden on this page. This will not
            affect other users viewing this page.
          </div>
        {/if}
      {/if}
    </div>

    <!-- Tournament admin controls -->
    {#if ctx.showOrganizerView}
      <div class="mt-3">
        {#if data.tournament.registration_open}
          <button
            type="button"
            class="btn btn-info"
            onclick={async () => {
              await setRegistrationStatus(false);
            }}
          >
            <FontAwesomeIcon icon="lock" /> Close registration
          </button>
        {:else if data.tournament.self_registration && data.stages.every((s) => s.rounds.length == 0)}
          <button
            type="button"
            class="btn btn-secondary"
            onclick={async () => {
              await setRegistrationStatus(true);
            }}
          >
            <FontAwesomeIcon icon="folder-open" /> Open registration
          </button>
          {#if data.tournament.locked_players > 0}
            <button
              type="button"
              class="btn btn-secondary"
              onclick={async () => {
                await setPlayerRegistrationStatus(false);
              }}
            >
              <FontAwesomeIcon icon="unlock" /> Unlock all players
            </button>
          {/if}
          {#if data.tournament.unlocked_players > 0}
            <button
              type="button"
              class="btn btn-info"
              onclick={async () => {
                await setPlayerRegistrationStatus(true);
              }}
            >
              <FontAwesomeIcon icon="lock" /> Lock all players
            </button>
          {/if}
        {/if}

        {#if data.stages.every((s) => s.rounds.every((r) => r.completed))}
          <button type="button" class="btn btn-success" onclick={pairNewRound}>
            <FontAwesomeIcon icon="plus" /> Pair new round!
          </button>
        {:else}
          <button class="btn btn-secondary disabled">
            <FontAwesomeIcon icon="plus" /> Pair new round!
          </button>
          <span class="ml-2">
            All rounds must be flagged complete before you can add a new round.
          </span>
        {/if}
      </div>
    {/if}

    <!-- Stages -->
    <div class="mt-3">
      {#each data.stages as stage, index (stage.format)}
        <Stage
          {stage}
          startExpanded={index === data.stages.length - 1}
          tournament={data.tournament}
          tournamentPolicies={data.policy}
          deleteCallback={deleteStageCallback}
          {deletePairingCallback}
          {changePlayerSideCallback}
          {reportScoreCallback}
          {completeRoundCallback}
          {updateTimerCallback}
        />
      {/each}
    </div>

    <!-- Elimination stage controls -->
    {#if ctx.showOrganizerView && data.stages.length > 0 && !data.stages[data.stages.length - 1].is_elimination}
      <h4>Cut to...</h4>
      <table>
        <tbody>
          <tr>
            <td>Single Elimination</td>
            {#each [3, 4, 8, 16] as num (num)}
              <td class="pl-2">
                <button
                  type="button"
                  class="btn btn-success"
                  onclick={async () => {
                    await addStage(true, num);
                  }}
                  aria-label={`cut to single elimination top ${num}`}
                >
                  <FontAwesomeIcon icon="scissors" /> Top {num}
                </button>
              </td>
            {/each}
          </tr>
          <tr>
            <td>Double Elimination</td>
            <td></td>
            {#each [4, 8, 16] as num (num)}
              <td class="pt-2 pl-2">
                <button
                  type="button"
                  class="btn btn-success"
                  onclick={async () => {
                    await addStage(false, num);
                  }}
                  aria-label={`cut to double elimination top ${num}`}
                >
                  <FontAwesomeIcon icon="scissors" /> Top {num}
                </button>
              </td>
            {/each}
          </tr>
        </tbody>
      </table>
    {/if}

    <!-- FAQ dialog -->
    <ModalDialog id="faq" headerText="FAQ">
      <h5>How does self reporting work?</h5>
      <ul>
        <li>
          For self reporting, a player needs to be logged in with the NRDB
          account they used to register for the tournament to ensure they are
          reporting only their games.
        </li>
        <li>
          Self reporting in Cobra works alongside the
          <span class="font-weight-bold">two-eye principle</span>: both players
          have to report the same result for Cobra to accept the answer and set
          the scores.
        </li>
      </ul>
      <h5>Does self reporting replace normal reports?</h5>
      <p>
        No, it just allows players to report their own scores instead of handing
        in manually. This should ease the overall reporting process.
      </p>
      <ul>
        <li>
          The TO can monitor any reports by clicking on
          <span class="font-weight-bold">'Reports'</span>
          which shows the scores reported.
        </li>
        <li>
          The TO can accept a single report by clicking on the provided option.
        </li>
        <li>As always, the TO can report games as normal.</li>
      </ul>
    </ModalDialog>
  {/if}
{:else}
  <div class="d-flex align-items-center m-2">
    <div class="spinner-border m-auto"></div>
  </div>
{/if}
