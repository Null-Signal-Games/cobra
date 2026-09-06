<script lang="ts">
  import "$lib/assets/css/pairings.sass";
  import Stage from "./Stage.svelte";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ModalDialog from "$lib/components/ModalDialog.svelte";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import { resolve } from "$app/paths";
  import type { PageProps } from "./$types";
  import { showReportedPairings } from "$lib/utils/ShowReportedPairings";
  import { showIdentities } from "$lib/utils/ShowIdentities";

  let { data, params }: PageProps = $props();

  let forcePlayerView = $state(false);

  function toggleForcePlayerView() {
    forcePlayerView = !forcePlayerView;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function addStage(cutSingleElim?: boolean, cutCount?: number) {
    // TODO: Implement
  }

  function pairNewRound() {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function setRegistrationStatus(open: boolean) {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function setPlayerRegistrationStatus(open: boolean) {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function deletePairingCallback(roundId: number, pairingId: number) {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function changePlayerSideCallback(roundId: number, pairingId: number, side: string) {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function reportScoreCallback(roundId: number, pairingId: number, report: ScoreReport, selfReport: boolean) {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function completeRoundCallback(roundId: number) {
    // TODO: Implement
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function updateTimerCallback(roundId: number, length_minutes: number, operation: string) {
    // TODO: Implement
  }
</script>

<div class="col-12">
  <GlobalMessages />
  
  <p></p>
  
  {#if data.stages.length == 0}
    <!-- Add Swiss stage button -->
    <button
      type="button"
      class="btn btn-success"
      onclick={async () => {
        await addStage();
      }}
    >
      <FontAwesomeIcon icon="plus" /> Add Swiss stage
    </button>
  {:else}
    <!-- Upper controls -->
    <div>
      {#if data.stages.every((s) => s.rounds.length === 0)}
        <a
          href={resolve(`/tournaments/${params.tournamentId}/players/meeting?back_to=pairings`)}
          class="btn btn-primary"
        >
          <FontAwesomeIcon icon="list-ul" /> Player meeting
        </a>
      {:else}
        <button
          type="button"
          class="btn btn-primary"
          onclick={() => {
            showReportedPairings.update((value) => !value);
  
          }}
        >
          <FontAwesomeIcon icon="eye-slash" /> Show/hide reported pairings
        </button>
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
            <FontAwesomeIcon icon="users" /> See player pairings view
          </button>
        {/if}
  
        {#if !$showReportedPairings}
          <div class="alert alert-info mt-3">
            Reported scores are currently hidden on this page. This will not
            affect other users viewing this page.
          </div>
        {/if}
      {/if}
    </div>
  
    <!-- Tournament admin controls -->
    <div class="mt-3">
      {#if !data.tournamentData.tournament.registration_closed}
        <button
          type="button"
          class="btn btn-info"
          onclick={async () => {
            await setRegistrationStatus(false);
          }}
        >
          <FontAwesomeIcon icon="lock" /> Close registration
        </button>
      {:else if data.tournamentData.tournament.self_registration && data.stages.every((s) => s.rounds.length == 0)}
        <button
          type="button"
          class="btn btn-secondary"
          onclick={async () => {
            await setRegistrationStatus(true);
          }}
        >
          <FontAwesomeIcon icon="folder-open" /> Open registration
        </button>
        {#if !data.tournamentData.tournament.all_players_unlocked}
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
        {#if data.tournamentData.tournament.any_player_unlocked}
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
  
    <!-- Stages -->
    <div class="mt-3">
      {#each data.stages as stage, index (stage.format)}
        <Stage
          {stage}
          startExpanded={index === data.stages.length - 1}
          tournament={data.tournamentData.tournament}
          tournamentPolicies={data.policy}
          {deletePairingCallback}
          {changePlayerSideCallback}
          {reportScoreCallback}
          {completeRoundCallback}
          {updateTimerCallback}
        />
      {/each}
    </div>
  
    <!-- Elimination stage controls -->
    {#if data.stages.length > 0 && !data.stages[data.stages.length - 1].is_elimination}
      <h4>Cut to...</h4>
      <table>
        <tbody>
          <tr>
            <td>Single Elimination</td>
            {#each [2, 3, 4, 8, 16] as num (num)}
              <td class="pl-2">
                <button
                  type="button"
                  class="btn btn-success"
                  style="width: 100px"
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
            <td class="pl-2"></td>
            <td class="pl-2"></td>
            {#each [4, 8, 16] as num (num)}
              <td class="pl-2">
                <button
                  type="button"
                  class="btn btn-success"
                  style="width: 100px"
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
</div>
