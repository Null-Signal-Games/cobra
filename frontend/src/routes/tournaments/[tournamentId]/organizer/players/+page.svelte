<script lang="ts">
  import { resolve } from "$app/paths";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import type { PageProps } from "./$types";
  import {
    Player,
  } from "$lib/model/Player";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import PlayerForm from "./PlayerForm.svelte";
  import { invalidateAll } from "$app/navigation";
  import {
    CutDeckVisibility,
    deckVisibilityString,
    SwissDeckVisibility,
  } from "$lib/model/Tournament";
  import { downloadBlob, quoteCsvValue } from "$lib/utils/files";
  import { deckCsv } from "$lib/utils/decks.svelte";
  import { loadDecks, saveTournament, setPlayerRegistrationStatus as setPlayerRegistrationStatusRequest ,
    setRegistrationStatus as setRegistrationStatusRequest, reinstatePlayer as reinstatePlayerRequest,} from "../../../api_helper"

  let { data, params }: PageProps = $props();

  let tournamentId: number = $derived(parseInt(params.tournamentId));

  let players = $derived(data.players);
  let tournament = $derived(players.tournament);
  let identityNames = $derived(data.identities);
  let newPlayer = $state(new Player());

  let registrationLockDescription = $derived.by(() => {
    if (tournament.registration_closed) {
      if (tournament.all_players_unlocked) {
        return "closed, unlocked";
      } else if (tournament.any_player_unlocked) {
        return "closed, part unlocked";
      }
      return "closed";
    }

    if (tournament.all_players_unlocked) {
      return "open";
    } else if (tournament.any_player_unlocked) {
      return "open, part locked";
    }
    return "open, all locked";
  });
  let deckVisibilityDescription = $derived.by(() => {
    return `swiss ${deckVisibilityString(tournament.swiss_deck_visibility)}, cut ${deckVisibilityString(tournament.cut_deck_visibility)}`;
  });

  async function newPlayerSavedCallback() {
    await invalidateAll();
    newPlayer = new Player();
  }

  async function setPlayerRegistrationStatus(locked: boolean) {
    const success = await setPlayerRegistrationStatusRequest(
      tournamentId,
      locked,
    );
    if (!success) {
      return;
    }

    await invalidateAll();
  }

  async function setRegistrationStatus(open: boolean) {
    const success = await setRegistrationStatusRequest(tournamentId, open);
    if (!success) {
      return;
    }

    await invalidateAll();
  }

  async function setCutDeckVisibility(visibility: CutDeckVisibility) {
    const tournamentEdit = $state.snapshot(tournament);

    if (visibility === CutDeckVisibility.Open) {
      if (
        !confirm(
          "This will make decklists of players registered for the cut visible to other players registered for the cut. Are you sure?",
        )
      ) {
        return;
      }
    } else if (visibility === CutDeckVisibility.Public) {
      if (
        !confirm(
          "This will make decklists of players registered for the cut visible to anyone who views the tournament. Are you sure?",
        )
      ) {
        return;
      }
    }

    tournamentEdit.cut_deck_visibility = visibility;

    const success = await saveTournament(tournamentEdit);
    if (!success) {
      return;
    }

    await invalidateAll();
  }

  async function setSwissDeckVisibility(visibility: SwissDeckVisibility) {
    const tournamentEdit = $state.snapshot(tournament);

    if (visibility === SwissDeckVisibility.Open) {
      if (
        !confirm(
          "This will make all decklists visible to all registered players in the tournament. Are you sure?",
        )
      ) {
        return;
      }
    } else if (visibility === SwissDeckVisibility.Public) {
      if (
        !confirm(
          "This will make all decklists visible to anyone who views the tournament. Are you sure?",
        )
      ) {
        return;
      }
    }

    tournamentEdit.swiss_deck_visibility = visibility;

    const success = await saveTournament(tournamentEdit);
    if (!success) {
      return;
    }

    await invalidateAll();
  }

  async function downloadDecksSpreadsheet() {
    const decks = await loadDecks(tournamentId);
    downloadBlob(
      `Decks for ${tournament.name}.csv`,
      new Blob([deckCsv(decks)], { type: "text/csv" }),
    );
  }

  function downloadStreamingSpreadsheet() {
    const contents =
      'Player,"Include in video coverage? (players were notified that in the cut it may not be possible to exclude them)"\n' +
      players.activePlayers
        .map(
          (player) =>
            `${quoteCsvValue(player.name)},${player.include_in_stream ? "Yes" : "No"}`,
        )
        .join("\n");
    downloadBlob(
      `Streaming information for ${tournament.name}.csv`,
      new Blob([`\ufeff${contents}`], { type: "text/csv" }),
    ); // "\ufeff" lets Excel know it's Unicode encoded
  }

  async function reinstatePlayer(player: Player) {
    const success = await reinstatePlayerRequest(tournamentId, player);
    if (!success) {
      return;
    }

    await invalidateAll();
  }
</script>

<div class="col-12">
    <GlobalMessages />

    {#if data}
      <a href={resolve(`/tournaments/${tournamentId}/player_meeting`)} class="btn btn-primary">
      <FontAwesomeIcon icon="list-ul" /> Player meeting
    </a>

    <!-- Register New Player -->
    <div class="alert alert-secondary mt-4">
        <h4>Register New Player</h4>
        {#key newPlayer}
        <PlayerForm
            player={newPlayer}
            tournament={tournament}
            tournamentPolicies={players.tournamentPolicies}
            identityNames={identityNames}
            organizerView={true}
            savedCallback={newPlayerSavedCallback}
        />
        {/key}
    </div>

    <!-- Players -->
    <h3 class="mt-4">
        Players

        <!-- Registration controls -->
        {#if tournament.self_registration}
        <span class="dropdown">
            <button
            class="btn btn-sm dropdown-toggle btn-light text-muted font-weight-bold"
            data-toggle="dropdown"
            >
            Registration: {registrationLockDescription}
            </button>
            <div class="dropdown-menu">
            <button
                class="dropdown-item {!tournament.any_player_unlocked
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setPlayerRegistrationStatus(true)}
            >
                <FontAwesomeIcon icon="lock" /> Lock all players, prevent editing
            </button>
            <button
                class="dropdown-item {tournament.all_players_unlocked
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setPlayerRegistrationStatus(false)}
            >
                <FontAwesomeIcon icon="unlock" /> Unlock all players, allow editing
            </button>
            <div class="dropdown-divider"></div>
            <button
                class="dropdown-item {tournament.registration_closed
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setRegistrationStatus(false)}
            >
                <FontAwesomeIcon icon="lock" /> Close registration, prevent new players
            </button>
            <button
                class="dropdown-item {!tournament.registration_closed
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setRegistrationStatus(true)}
            >
                <FontAwesomeIcon icon="unlock" /> Open registration, allow new players
            </button>
            </div>
        </span>
        {/if}

        <!-- Deck controls -->
        {#if tournament.nrdb_deck_registration}
        <!-- Deck visibility dropdown -->
        <span class="dropdown">
            <button
            class="btn btn-sm dropdown-toggle btn-light text-muted font-weight-bold"
            data-toggle="dropdown"
            >
            Decks: {deckVisibilityDescription}
            </button>
            <div class="dropdown-menu">
            <button
                class="dropdown-item {tournament.swiss_deck_visibility ===
                SwissDeckVisibility.Private
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setSwissDeckVisibility(SwissDeckVisibility.Private)}
            >
                <FontAwesomeIcon icon="eye-slash" /> Make decks in swiss private
            </button>
            <button
                class="dropdown-item {tournament.swiss_deck_visibility ===
                SwissDeckVisibility.Open
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setSwissDeckVisibility(SwissDeckVisibility.Open)}
            >
                <FontAwesomeIcon icon="eye" /> Make decks in swiss open, visible to participants
            </button>
            <button
                class="dropdown-item {tournament.swiss_deck_visibility ===
                SwissDeckVisibility.Public
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setSwissDeckVisibility(SwissDeckVisibility.Public)}
            >
                <FontAwesomeIcon icon="eye" />
                Make decks in swiss public, visible to anyone
            </button>
            <div class="dropdown-divider"></div>
            <button
                class="dropdown-item {tournament.cut_deck_visibility ===
                CutDeckVisibility.Private
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setCutDeckVisibility(CutDeckVisibility.Private)}
            >
                <FontAwesomeIcon icon="eye-slash" /> Make decks in cut private
            </button>
            <button
                class="dropdown-item {tournament.cut_deck_visibility ===
                CutDeckVisibility.Open
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setCutDeckVisibility(CutDeckVisibility.Open)}
            >
                <FontAwesomeIcon icon="eye" /> Make decks in cut open, visible to participants
            </button>
            <button
                class="dropdown-item {tournament.cut_deck_visibility ===
                CutDeckVisibility.Public
                ? 'disabled'
                : ''}"
                style="cursor: pointer"
                onclick={() => setCutDeckVisibility(CutDeckVisibility.Public)}
            >
                <FontAwesomeIcon icon="eye" /> Make decks in cut public, visible to anyone
            </button>
            </div>
        </span>

        <!-- Decks spreadsheet -->
        <button
            type="button"
            class="btn btn-link text-info"
            onclick={downloadDecksSpreadsheet}
        >
            <FontAwesomeIcon icon="download" />
            Decks spreadsheet
        </button>
        {/if}

        <!-- Streaming spreadsheet -->
        {#if tournament.allow_streaming_opt_out}
        <button
            type="button"
            class="btn btn-link text-info"
            onclick={downloadStreamingSpreadsheet}
        >
            <FontAwesomeIcon icon="download" />
            Streaming spreadsheet
        </button>
        {/if}
    </h3>
    <ul class="list-group">
        {#each players.activePlayers as player (player.id)}
        <li class="list-group-item">
            <PlayerForm
            {player}
            tournament={tournament}
            tournamentPolicies={players.tournamentPolicies}
            identityNames={identityNames}
            organizerView={true}
            savedCallback={invalidateAll}
            droppedCallback={invalidateAll}
            deletedCallback={invalidateAll}
            />
        </li>
        {/each}
    </ul>

    <!-- Dropped players -->
    {#if players.droppedPlayers}
        <h3 class="mt-4">Dropped Players</h3>
        <table class="table table-striped">
        <tbody>
            {#each players.droppedPlayers as player (player.id)}
            <tr>
                <td>
                {player.name} ({player.corp_id.name}, {player.runner_id.name})
                </td>
                <td>
                <button
                    type="button"
                    class="btn btn-warning"
                    onclick={() => reinstatePlayer(player)}
                >
                    <FontAwesomeIcon icon="arrow-up" /> Reinstate
                </button>
                </td>
            </tr>
            {/each}
        </tbody>
        </table>
    {/if}
    {:else}
    <div class="d-flex align-items-center m-2">
        <div class="spinner-border m-auto"></div>
    </div>
    {/if}

</div>
