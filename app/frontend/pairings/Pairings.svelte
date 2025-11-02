<script lang="ts">
  import { onMount } from "svelte";
  import Stage from "./Stage.svelte";
  import { PairingsData, loadPairings } from "./PairingsData";
  import { showIdentities } from "./ShowIdentities";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import ModalDialog from "../widgets/ModalDialog.svelte";
  import { redirectRequest } from "../utils/requests";

  interface Props {
    tournamentId: number;
  }

  let { tournamentId }: Props = $props();

  let data = $state(new PairingsData());
  let showReportedPairings = $state(true);

  onMount(async () => {
    data = await loadPairings(tournamentId);
  });

  function pairNewRound(e: MouseEvent) {
    if (
      data.tournament.registration_unlocked &&
      !confirm(
        "Registration is still open or some players are unlocked. Pair new round anyway?",
      )
    ) {
      return;
    }

    redirectRequest(
      e,
      `/tournaments/${tournamentId}/rounds`,
      "POST",
      data.csrf_token,
    );
  }
</script>

{#if !data.stages || data.stages.length == 0}
  <!-- Add Swiss stage button -->
  {#if data.policy.update}
    <button
      type="button"
      class="btn btn-success"
      onclick={(e) =>
        redirectRequest(
          e,
          `/tournaments/${tournamentId}/stages`,
          "POST",
          data.csrf_token,
        )}
    >
      <FontAwesomeIcon icon="plus" /> Add Swiss stage
    </button>
  {/if}
{:else}
  <!-- Upper controls -->
  <div>
    {#if !data.stages || data.stages.every((s) => !s.rounds || s.rounds.length == 0)}
      <a
        href="/tournaments/{tournamentId}/players/meeting"
        class="btn btn-primary"
      >
        <FontAwesomeIcon icon="list-ul" /> Player meeting
      </a>
    {:else if data.stages.some((s) => s.rounds?.length > 0)}
      {#if data.policy.update}
        <button
          class="btn btn-primary"
          onclick={(_) => (showReportedPairings = !showReportedPairings)}
        >
          <FontAwesomeIcon icon="eye-slash" /> Show/hide reported pairings
        </button>
      {/if}
      <button
        class="btn btn-primary"
        onclick={(_) => showIdentities.update((value) => !value)}
      >
        <FontAwesomeIcon icon="eye-slash" /> Show/hide identities
      </button>
      <a
        href="/tournaments/{tournamentId}/rounds/view_pairings"
        class="btn btn-primary"
      >
        <FontAwesomeIcon icon="users" /> See player pairings view
      </a>
      <button
        type="button"
        class="btn btn-info"
        data-toggle="modal"
        data-target="#faq"
      >
        <FontAwesomeIcon icon="question" /> FAQ
      </button>
      {#if !showReportedPairings}
        <div class="alert alert-info mt-3">
          Reported scores are currently hidden on this page. This will not
          affect other users viewing this page.
        </div>
      {/if}
    {/if}
  </div>

  <!-- Tournament admin controls -->
  {#if data.policy.update}
    <div class="mt-3">
      {#if data.tournament.registration_open}
        <button
          class="btn btn-info"
          onclick={(e) =>
            redirectRequest(
              e,
              `/tournaments/${tournamentId}/close_registration`,
              "PATCH",
              data.csrf_token,
            )}
        >
          <FontAwesomeIcon icon="lock" /> Close registration
        </button>
      {:else if data.tournament.self_registration && data.stages.every((s) => !s.rounds || s.rounds.length == 0)}
        <button
          class="btn btn-secondary"
          onclick={(e) =>
            redirectRequest(
              e,
              `/tournaments/${tournamentId}/open_registration`,
              "PATCH",
              data.csrf_token,
            )}
        >
          <FontAwesomeIcon icon="folder-open" /> Open registration
        </button>
        {#if data.tournament.locked_players > 0}
          <button
            class="btn btn-secondary"
            onclick={(e) =>
              redirectRequest(
                e,
                `/tournaments/${tournamentId}/unlock_player_registrations`,
                "PATCH",
                data.csrf_token,
              )}
          >
            <FontAwesomeIcon icon="unlock" /> Unlock all players
          </button>
        {/if}
        {#if data.tournament.unlocked_players > 0}
          <button
            class="btn btn-info"
            onclick={(e) =>
              redirectRequest(
                e,
                `/tournaments/${tournamentId}/lock_player_registrations`,
                "PATCH",
                data.csrf_token,
              )}
          >
            <FontAwesomeIcon icon="lock" /> Lock all players
          </button>
        {/if}
      {/if}

      {#if data.stages.every((s) => s.rounds.every((r) => r.completed))}
        <button class="btn btn-success" onclick={pairNewRound}>
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
        {tournamentId}
        startExpanded={index === data.stages.length - 1}
        {showReportedPairings}
        tournamentPolicies={data.policy}
        csrfToken={data.csrf_token}
      />
    {/each}
  </div>

  <!-- Elimination stage controls -->
  {#if data.policy.update && data.stages.length > 0 && !data.stages[data.stages.length - 1].is_elimination}
    <h4>Cut to...</h4>
    <table>
      <tbody>
        <tr>
          <td>Single Elimination</td>
          {#each [3, 4, 8, 16] as num}
            <td class="pl-2">
              <button
                class="btn btn-success"
                onclick={(e) =>
                  redirectRequest(
                    e,
                    `/tournaments/${tournamentId}/cut?elimination_type=single&number=${num}`,
                    "POST",
                    data.csrf_token,
                  )}
              >
                <FontAwesomeIcon icon="scissors" /> Top {num}
              </button>
            </td>
          {/each}
        </tr>
        <tr>
          <td>Double Elimination</td>
          <td></td>
          {#each [4, 8, 16] as num}
            <td class="pt-2 pl-2">
              <button
                class="btn btn-success"
                onclick={(e) =>
                  redirectRequest(
                    e,
                    `/tournaments/${tournamentId}/cut?number=${num}`,
                    "POST",
                    data.csrf_token,
                  )}
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
        For self reporting, a player needs to be logged in with the NRDB account
        they used to register for the tournament to ensure they are reporting
        only their games.
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
