<script lang="ts">
  import { resolve } from "$app/paths";
  import type { IdentityNames } from "$lib/model/Identity";
  import type { Tournament, TournamentPolicies } from "$lib/model/Tournament";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ProgressButton from "$lib/components/ProgressButton.svelte";
  import {
    Player,
  } from "$lib/model/Player";
  import {
    savePlayer,
    deletePlayer as deletePlayerRequest,
    togglePlayerLock as togglePlayerLockRequest,
    dropPlayer as dropPlayerRequest,
  } from "../../../api_helper";
  import IdentitySelect from "$lib/components/IdentitySelect.svelte";
  import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

  let {
    player,
    tournament,
    tournamentPolicies,
    identityNames,
    organizerView = false,
    savedCallback,
    droppedCallback,
    deletedCallback,
  }: {
    player: Player;
    tournament: Tournament;
    tournamentPolicies: TournamentPolicies;
    identityNames: IdentityNames;
    organizerView?: boolean;
    savedCallback?: (player: Player) => void;
    droppedCallback?: (player: Player) => void;
    deletedCallback?: (player: Player) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  let playerEdit = $state($state.snapshot(player));

  async function togglePlayerLock() {
    const success = await togglePlayerLockRequest(tournament.id, playerEdit);
    if (!success) {
      return false;
    }
    playerEdit.registration_locked = !playerEdit.registration_locked;

    savedCallback?.(playerEdit);

    return true;
  }

  function confirmSave() {
    return (
      playerEdit.id !== 0 ||
      !tournament.registration_closed ||
      confirm("Tournament is closed, add new player anyway?")
    );
  }

  async function save() {
    await savePlayer(tournament.id, playerEdit, organizerView);
    savedCallback?.(playerEdit);

    return globalMessages.errors.length === 0;
  }

  async function dropPlayer() {
    const success = await dropPlayerRequest(tournament.id, playerEdit);
    if (!success) {
      return false;
    }

    droppedCallback?.(playerEdit);

    return true;
  }

  function confirmDelete() {
    return confirm(
      `Are you sure you want to delete player "${playerEdit.name}"?`,
    );
  }

  async function deletePlayer() {
    const success = await deletePlayerRequest(tournament.id, playerEdit);
    if (!success) {
      return false;
    }

    deletedCallback?.(playerEdit);

    return true;
  }
</script>

<div class="identities_form form-row">
  <!-- Name -->
  <div class="col">
    {#if playerEdit.id !== 0 && tournament.self_registration}
      <span class="text-info float-left mr-2" style="width: 12px">
        <FontAwesomeIcon
          icon={playerEdit.registration_locked ? "lock" : "unlock"}
        />
      </span>
    {/if}

    <label for="player_name_{playerEdit.id}">Name</label>
    <input
      id="player_name_{playerEdit.id}"
      type="text"
      class="form-control"
      placeholder="Enter player name"
      bind:value={playerEdit.name}
    />
  </div>

  <!-- Pronouns -->
  <div class="col">
    <label for="player_pronouns_{playerEdit.id}">Pronouns</label>
    <input
      id="player_pronouns_{playerEdit.id}"
      type="text"
      class="form-control"
      placeholder="Example: they/them"
      bind:value={playerEdit.pronouns}
    />
  </div>

  {#if !tournament.nrdb_deck_registration || playerEdit.id !== 0}
    <!-- Corp ID -->
    <div class="col w-25">
      <label for="player_corp_id_{playerEdit.id}">Corp ID</label>
      <IdentitySelect
        id="player_corp_id_{playerEdit.id}"
        placeholder="Search for corp ID"
        enabled={!tournament.nrdb_deck_registration}
        identityNames={identityNames.corp}
        bind:value={playerEdit.corp_id.name}
      />
    </div>

    <!-- Runner ID -->
    <div class="col w-25">
      <label for="player_runner_id_{playerEdit.id}">Runner ID</label>
      <IdentitySelect
        id="player_runner_id_{playerEdit.id}"
        placeholder="Search for runner ID"
        enabled={!tournament.nrdb_deck_registration}
        identityNames={identityNames.runner}
        bind:value={playerEdit.runner_id.name}
      />
    </div>
  {:else}
    <div class="col"></div>
    <div class="col"></div>
  {/if}
</div>

<div class="form-row mt-2">
  <!-- Streaming opt-out -->
  {#if tournament.allow_streaming_opt_out}
    <div class="col-auto form-check form-check-inline">
      <input
        id="player_include_in_stream_{playerEdit.id}"
        type="checkbox"
        class="form-check-input"
        bind:checked={playerEdit.include_in_stream}
      />
      <label
        for="player_include_in_stream_{playerEdit.id}"
        class="form-check-label"
      >
        Video coverage allowed
      </label>
    </div>
  {/if}

  {#if tournamentPolicies.update}
    <!-- First round bye -->
    <div class="col-auto form-check form-check-inline">
      <input
        id="player_first_round_bye_{playerEdit.id}"
        type="checkbox"
        class="form-check-input"
        bind:checked={playerEdit.first_round_bye}
      />
      <label
        for="player_first_round_bye_{playerEdit.id}"
        class="form-check-label"
      >
        First round bye
      </label>
    </div>

    <!-- Manual seed -->
    {#if tournament.manual_seed}
      <div class="col-auto form-inline">
        <label for="player_seed_{playerEdit.id}">Manual Seed</label>
        <input
          id="player_seed_{playerEdit.id}"
          type="number"
          class="form-control ml-1"
          style="width: 6em"
          placeholder="Set seed"
          bind:value={playerEdit.manual_seed}
        />
      </div>
    {/if}
  {/if}

  <!-- Fixed table number -->
  <div class="col-auto form-inline">
    <label for="table_number_{playerEdit.id}">Fixed table number</label>
    <input
      id="table_number_{playerEdit.id}"
      type="number"
      class="form-control ml-1"
      style="width: 6em"
      placeholder="Table #"
      bind:value={playerEdit.fixed_table_number}
    />
  </div>
</div>

<!-- Actions -->
<div class="text-right">
  <!-- Lock/unlock player -->
  {#if tournament.self_registration && playerEdit.id !== 0}
    <ProgressButton
      css="btn btn-link text-info"
      inProgressText={playerEdit.registration_locked
        ? "Unlocking player"
        : "Locking player"}
      completeText={playerEdit.registration_locked
        ? "Locked player"
        : "Unlocked player"}
      onclick={togglePlayerLock}
    >
      {#if playerEdit.registration_locked}
        <FontAwesomeIcon icon="unlock" /> Unlock player
      {:else}
        <FontAwesomeIcon icon="lock" /> Lock player
      {/if}
    </ProgressButton>
  {/if}

  <!-- View decks -->
  {#if tournament.nrdb_deck_registration && playerEdit.id !== 0}
    <a
      href={resolve(`/tournaments/${tournament.id}/organizer/players/${playerEdit.id}/registration`)}
      class="btn btn-link text-info"
    >
      <FontAwesomeIcon icon="eye" />
      View decks
    </a>
  {/if}

  <!-- Create/Save -->
  <ProgressButton
    css="btn btn-success"
    inProgressText={playerEdit.id === 0 ? "Creating" : "Saving"}
    completeText={playerEdit.id === 0 ? "Created" : "Saved"}
    confirm={confirmSave}
    onclick={save}
  >
    {#if playerEdit.id === 0}
      <FontAwesomeIcon icon="plus" /> Create
    {:else}
      <FontAwesomeIcon icon="floppy-o" /> Save
    {/if}
  </ProgressButton>

  {#if playerEdit.id !== 0}
    <!-- Drop -->
    <ProgressButton
      css="btn btn-warning"
      inProgressText="Dropping"
      completeText="Dropped"
      onclick={dropPlayer}
    >
      <FontAwesomeIcon icon="arrow-down" /> Drop
    </ProgressButton>

    <!-- Delete -->
    <ProgressButton
      css="btn btn-danger"
      inProgressText="Deleting"
      completeText="Deleted"
      confirm={confirmDelete}
      onclick={deletePlayer}
    >
      <FontAwesomeIcon icon="trash" /> Delete
    </ProgressButton>
  {/if}
</div>
