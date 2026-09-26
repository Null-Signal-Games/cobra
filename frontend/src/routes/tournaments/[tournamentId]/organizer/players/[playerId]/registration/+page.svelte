<script lang="ts">
  import { Identity } from "$lib/model/Identity";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ProgressButton from "$lib/components/ProgressButton.svelte";
  import { resolve } from "$app/paths";
  import type { PageProps } from "./$types";
  import { invalidateAll } from "$app/navigation";
  import { savePlayer } from "../../../../../api_helper";
  import DeckDisplay from "$lib/components/DeckDisplay.svelte";
  import { sortCards } from "$lib/utils/decks.svelte";

  let { data, params }: PageProps = $props();

  // svelte-ignore state_referenced_locally
  let player = $state($state.snapshot(data.registrationPlayer));
  // svelte-ignore state_referenced_locally
  let corpDeck = $state($state.snapshot(data.corpDeck));
  // svelte-ignore state_referenced_locally
  let runnerDeck = $state($state.snapshot(data.runnerDeck));
  let editing = $state(false);

  function toggleEditing() {
    editing = !editing;
  }

  async function save() {
    if (!player) {
      return true;
    }

    player.corp_deck =
      corpDeck.details.identity_title || corpDeck.cards.length > 0
        ? corpDeck
        : undefined;
    player.corp_id = Object.assign(new Identity(), {
      name: corpDeck.details.identity_title ?? "",
      faction: corpDeck.details.faction_id,
    });
    player.runner_deck =
      runnerDeck.details.identity_title || runnerDeck.cards.length > 0
        ? runnerDeck
        : undefined;
    player.runner_id = Object.assign(new Identity(), {
      name: runnerDeck.details.identity_title ?? "",
      faction: runnerDeck.details.faction_id,
    });
    Object.assign(
      player,
      await savePlayer(
        parseInt(params.tournamentId),
        player,
        player.user_id !== data.tournamentData.tournament.user_id,
      ),
    );

    await invalidateAll();

    sortCards(corpDeck.cards);
    sortCards(runnerDeck.cards);

    if (editing) {
      toggleEditing();
    }

    return true;
  }
</script>

<div class="col-12">
  <GlobalMessages />
  
  {#if player && player.id !== 0}
    <!-- General registration information -->
    <div class="card mb-3" aria-label="registration information">
      <div class="card-header">
        <div class="d-flex justify-content-between">
          <h5 class="mb-0">My Registration Information</h5>
          <span class="float-right dontprint">
            <button
              type="button"
              class="btn btn-link p-0 mr-3"
              title="Print"
              onclick={() => {
                window.print();
              }}
            >
              <FontAwesomeIcon icon="print" />
            </button>
            <a
              href={resolve(`/tournaments/${params.tournamentId}/organizer/players`)}
              class="btn btn-link p-0"
              title="Cancel"
            >
              <FontAwesomeIcon icon="undo" />
            </a>
          </span>
        </div>
      </div>
  
      <div class="card-body">
        <div class="identities_form form-row">
          <!-- Name -->
          <div class="col-4">
            <label for="name">Name</label>
            <input
              id="name"
              type="text"
              class="form-control"
              placeholder="Enter player name"
              bind:value={player.name}
            />
          </div>
  
          <!-- Pronouns -->
          <div class="col-4">
            <label for="pronouns">Pronouns</label>
            <input
              id="pronouns"
              type="text"
              class="form-control"
              placeholder="Example: they/them"
              bind:value={player.pronouns}
            />
          </div>
        </div>
  
        <div class="form-row mt-2">
          <!-- Streaming opt-out -->
          {#if data.tournamentData.tournament.allow_streaming_opt_out}
            <div class="col-4 form-check form-check-inline">
              <input
                id="include_in_stream"
                type="checkbox"
                class="form-check-input"
                bind:checked={player.include_in_stream}
              />
              <label for="include_in_stream" class="form-check-label">
                Video coverage allowed
              </label>
            </div>
          {/if}
        </div>
  
        <div class="dontprint mt-sm-2">
          <div class="float-left">
            {#if editing}
              <button
                type="button"
                class="btn btn-link"
                onclick={toggleEditing}
              >
                <FontAwesomeIcon icon="undo" />
                Cancel edits
              </button>
            {:else}
              <a
                href={resolve(`/tournaments/${params.tournamentId}/registration`)}
                class="btn btn-link"
              >
                <FontAwesomeIcon icon="edit" />
                Choose decks from your NetrunnerDB account
              </a>
              {#if corpDeck.details.id !== 0 || runnerDeck.details.id !== 0}
                <button
                  type="button"
                  class="btn btn-link"
                  onclick={toggleEditing}
                >
                  <FontAwesomeIcon icon="edit" />
                  Edit decks in place
                </button>
              {/if}
            {/if}
          </div>
  
          <div class="float-right">
            <!-- Create/Save -->
            <ProgressButton
              css="btn btn-success"
              inProgressText="Saving"
              completeText="Saved"
              onclick={save}
            >
              <FontAwesomeIcon icon="floppy-o" /> Save
            </ProgressButton>
          </div>
        </div>
      </div>
    </div>
  
    <div class="alert alert-danger dontprint">
      <FontAwesomeIcon icon="exclamation-triangle" /> Deck legality is not yet checked.
      Please ensure your decks are legal.
    </div>

    <!-- Deck display -->
    <div class="row">
      <div class="col-md-6">
        <DeckDisplay
          bind:deck={corpDeck}
          originalDeck={data.corpDeck}
          isCorp={true}
          editMode={editing}
        />
      </div>
  
      <div class="col-md-6">
        <DeckDisplay
          bind:deck={runnerDeck}
          originalDeck={data.runnerDeck}
          isCorp={false}
          editMode={editing}
        />
      </div>
  
      {#if editing}
        <div class="col-md-12">
          <ProgressButton
            css="btn btn-success float-right"
            inProgressText="Saving"
            completeText="Saved"
            onclick={save}
          >
            <FontAwesomeIcon icon="floppy-o" /> Save
          </ProgressButton>
        </div>
      {/if}
    </div>
  {:else}
    <div class="d-flex align-items-center m-2">
      <div class="spinner-border m-auto"></div>
    </div>
  {/if}
</div>
