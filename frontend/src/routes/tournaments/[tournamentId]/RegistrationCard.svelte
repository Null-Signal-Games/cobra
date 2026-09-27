<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { Player } from "$lib/model/Player";
  import type { Tournament } from "$lib/model/Tournament";
  import type { IdentityNames } from "$lib/model/Identity";
  import { resolve } from "$app/paths";
  import IdentitySelect from "$lib/components/IdentitySelect.svelte";
  import ProgressButton from "$lib/components/ProgressButton.svelte";
  import Identity from "$lib/components/identity/Identity.svelte";
  import { onMount } from "svelte";
  import { loadIdentityNames, savePlayer as savePlayerRequest } from "$lib/api/beta";
  import { navigateTo } from "$lib/utils/navigation";
  import { authStore } from "$lib/utils/auth.svelte";

  let {
    userId,
    tournament,
    player,
  }: {
    userId: number;
    tournament: Tournament;
    player: Player;
  } = $props();

  let identityNames: IdentityNames | undefined = $state();
  // svelte-ignore state_referenced_locally
  let playerEdit = $state($state.snapshot(player));
  let playerAgreed = $state(false);
  let readOnly = $derived(playerEdit.id !== 0);

  onMount(async () => {
    identityNames = await loadIdentityNames();
    if (playerEdit.id === 0) {
      playerEdit.name = authStore.user?.nrdb_username ?? "";
    }
  });

  async function savePlayer() {
    playerEdit = await savePlayerRequest(tournament.id, playerEdit);
    readOnly = true;

    if (tournament.nrdb_deck_registration) {
      navigateTo(`/beta/tournaments/${tournament.id}/registration`);
    }

    return true;
  }
</script>

{#if readOnly}
  <div class="card">
    <div class="card-header d-flex justify-content-between">
      <h5 class="mb-0">My Registration Information</h5>

      {#if tournament.nrdb_deck_registration}
        <a href={resolve(`/tournaments/${tournament.id}/registration`)}>
          <FontAwesomeIcon icon="edit" />
          Edit
        </a>
      {:else}
        <button
          type="button"
          class="btn btn-link text-info p-0"
          onclick={() => {
            readOnly = false;
          }}
        >
          <FontAwesomeIcon icon="edit" />
          Edit
        </button>
      {/if}
    </div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item">
        <div class="small text-secondary">Name:</div>
        <div aria-label="name">
          {playerEdit.name_with_pronouns}
        </div>
      </li>
      <li class="list-group-item">
        <div class="small text-secondary">Corp ID:</div>
        <div aria-label="corp ID">
          <Identity
            identity={playerEdit.corp_id}
            name_if_missing="Unspecified"
            icon_if_missing="interrupt"
          />
        </div>
      </li>
      <li class="list-group-item">
        <div class="small text-secondary">Runner ID:</div>
        <div aria-label="runner ID">
          <Identity
            identity={playerEdit.runner_id}
            name_if_missing="Unspecified"
            icon_if_missing="interrupt"
          />
        </div>
      </li>
      <li class="list-group-item">
        <div class="small text-secondary">First Round Bye:</div>
        {#if playerEdit.first_round_bye}
          <div class="badge badge-success" aria-label="first round bye">
            YES
          </div>
        {:else}
          <div class="badge badge-secondary" aria-label="first round bye">
            NO
          </div>
        {/if}
      </li>
      <li class="list-group-item">
        <div class="small text-secondary">Stream my games:</div>
        {#if playerEdit.include_in_stream}
          <div class="badge badge-success" aria-label="stream my games">
            YES
          </div>
        {:else}
          <div class="badge badge-secondary" aria-label="stream my games">
            NO
          </div>
        {/if}
      </li>
    </ul>
  </div>
{:else}
  <div class="card alert alert-secondary">
    <div class="card-header d-flex justify-content-between">
      <h5 class="mb-0">
        {#if playerEdit.id === 0}
          Register for this Event
        {:else}
          My Registration Information
        {/if}
      </h5>

      {#if playerEdit.id !== 0}
        <button
          type="button"
          class="btn btn-link text-info p-0"
          onclick={() => {
            readOnly = true;
          }}
        >
          <FontAwesomeIcon icon="undo" />
          Cancel
        </button>
      {/if}
    </div>

    <div class="identities_form d-block">
      <div class="form-group">
        <label class="d-block" for="name">Name</label>
        <input
          id="name"
          type="text"
          placeholder="Enter your name"
          class="form-control"
          bind:value={playerEdit.name}
        />
      </div>

      <div class="form-group">
        <label class="d-block" for="pronouns">Pronouns</label>
        <input
          id="pronouns"
          type="text"
          placeholder="Example: they/them"
          class="form-control"
          bind:value={playerEdit.pronouns}
        />
      </div>

      {#if !tournament.nrdb_deck_registration}
        <div class="form-group">
          <label class="d-block" for="corp-identity">Corp ID</label>
          <IdentitySelect
            id="corp-identity"
            placeholder="Search for corp ID"
            identityNames={identityNames ? identityNames.corp : []}
            bind:value={playerEdit.corp_id.name}
          />
        </div>

        <div class="form-group">
          <label class="d-block" for="runner-identity">Runner ID</label>
          <IdentitySelect
            id="runner-identity"
            placeholder="Search for runner ID"
            identityNames={identityNames ? identityNames.runner : []}
            bind:value={playerEdit.runner_id.name}
          />
        </div>
      {/if}

      {#if tournament.allow_streaming_opt_out}
        <div class="form-group">
          <label for="include_in_stream">
            Should we include your games in video coverage of this event? Note:
            During a top cut it may not be possible to exclude you from
            coverage.
          </label>
          <input
            id="include_in_stream"
            type="checkbox"
            bind:checked={playerEdit.include_in_stream}
          />
          <label for="include_in_stream">
            Include my games in video coverage
          </label>
        </div>
      {/if}

      {#if userId === tournament.user_id}
        <div class="form-group">
          <input
            id="first_round_bye"
            type="checkbox"
            bind:checked={playerEdit.first_round_bye}
          />
          <label for="first_round_bye">First Round Bye</label>
        </div>

        {#if tournament.manual_seed}
          <div class="form-group">
            <label class="d-block" for="manual_seed">Manual Seed</label>
            <input
              id="manual_seed"
              type="number"
              placeholder="Set seed"
              class="form-control"
              bind:value={playerEdit.manual_seed}
            />
          </div>
        {/if}
      {/if}

      {#if playerEdit.id === 0}
        <hr />

        <div class="form-group">
          <label for="consent_data_sharing">
            Your name, pronouns and Netrunner deck identities will be publicly
            visible on this website. If you submit decklists they will be shared
            with the organiser. If you enter a round with open decklists, they
            may be shared with participants or made public.
          </label>
          <input
            id="consent_data_sharing"
            type="checkbox"
            bind:checked={playerAgreed}
          />
          <label for="consent_data_sharing">I agree to these terms</label>
        </div>
      {/if}
    </div>

    <div class="text-right">
      <ProgressButton
        css="btn btn-primary"
        disabled={playerEdit.id === 0 && !playerAgreed}
        inProgressText="Registering player"
        completeText="Registered player"
        onclick={savePlayer}
      >
        <FontAwesomeIcon icon="user-plus" />
        {#if playerEdit.id !== 0}
          Submit
        {:else if tournament.nrdb_deck_registration}
          Deck Registration
        {:else}
          Register
        {/if}
      </ProgressButton>
    </div>
  </div>
{/if}
