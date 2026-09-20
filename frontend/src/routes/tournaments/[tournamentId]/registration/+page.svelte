<script lang="ts">
  import { Deck } from "$lib/model/Deck";
  import { Identity } from "$lib/model/Identity";
  import { savePlayer } from "../../api_helper";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ProgressButton from "$lib/components/ProgressButton.svelte";
  import DeckDisplay from "./DeckDisplay.svelte";
  import { resolve } from "$app/paths";
  import type { PageProps } from "./$types";
  import { invalidateAll } from "$app/navigation";
  import { sortCards } from "$lib/utils/decks.svelte";

  let { data, params }: PageProps = $props();

  const THE_CATALYST_NRDB_CODE = "30076";
  const THE_SYNDICATE_NRDB_CODE = "30077";

  let originalCorpDeck = $state(new Deck());
  let corpDeck = $state(new Deck());
  let originalRunnerDeck = $state(new Deck());
  let runnerDeck = $state(new Deck());
  let editMode = $state(true); // TODO: Should this be removed in favor of splitting the page in to separate routes?
  let editing = $state(false);

  function toggleEditing() {
    editing = !editing;
    resetEditDecks();
  }

  function resetEditDecks() {
    corpDeck = $state.snapshot(originalCorpDeck);
    sortCards(corpDeck.cards);
    runnerDeck = $state.snapshot(originalRunnerDeck);
    sortCards(runnerDeck.cards);
  }

  async function save() {
    if (!data.player) {
      return true;
    }

    data.player.corp_deck =
      corpDeck.details.identity_title || corpDeck.cards.length > 0
        ? corpDeck
        : undefined;
    data.player.corp_id = Object.assign(new Identity(), {
      name: corpDeck.details.identity_title ?? "",
      faction: corpDeck.details.faction_id,
    });
    data.player.runner_deck =
      runnerDeck.details.identity_title || runnerDeck.cards.length > 0
        ? runnerDeck
        : undefined;
    data.player.runner_id = Object.assign(new Identity(), {
      name: runnerDeck.details.identity_title ?? "",
      faction: runnerDeck.details.faction_id,
    });
    Object.assign(
      data.player,
      await savePlayer(
        parseInt(params.tournamentId),
        data.player,
        data.player.user_id !== data.tournamentData.tournament.user_id,
      ),
    );

    await invalidateAll();
    resetEditDecks();

    if (editing) {
      toggleEditing();
    }

    return true;
  }

  function selectDeck(deck: Deck, isCorp: boolean) {
    if (isCorp) {
      originalCorpDeck =
        deck.details.nrdb_uuid === originalCorpDeck.details.nrdb_uuid
          ? new Deck()
          : deck;
    } else {
      originalRunnerDeck =
        deck.details.nrdb_uuid === originalRunnerDeck.details.nrdb_uuid
          ? new Deck()
          : deck;
    }
    resetEditDecks();
  }
</script>

<div class="col-12">
  <GlobalMessages />
  
  {#snippet deckListItem(deck: Deck, isCorp: boolean)}
    <button
      class="list-group-item list-group-item-action {deck.details.nrdb_uuid ===
      (isCorp
        ? originalCorpDeck.details.nrdb_uuid
        : originalRunnerDeck.details.nrdb_uuid)
        ? 'active'
        : ''}"
      onclick={() => {
        selectDeck(deck, isCorp);
      }}
    >
      <div
        class="deck-list-identity"
        style={`background-image:url(https://card-images.netrunnerdb.com/v2/small/${deck.details.identity_nrdb_printing_id}.jpg)`}
      ></div>
      <p class="mb-1">{deck.details.name}</p>
      <small>{deck.details.identity_title}</small>
    </button>
  {/snippet}
  
  {#snippet decksList(isCorp: boolean, selectedDeck: Deck)}
    <ul class="list-group list-group-flush" style="border-bottom: 0;">
      <li class="list-group-item selected-deck">
        {#if selectedDeck.details.nrdb_uuid}
          <div class="selected-deck-buttons">
            <button
              type="button"
              title="Deselect"
              class="btn btn-link p-0"
              onclick={() => {
                selectDeck(new Deck(), isCorp);
              }}
            >
              <FontAwesomeIcon icon="close" />
            </button>
          </div>
          <div
            class="selected-deck-identity"
            style={`background-image:url(https://card-images.netrunnerdb.com/v2/small/${selectedDeck.details.identity_nrdb_printing_id}.jpg)`}
          ></div>
          <p class="mb-1">{selectedDeck.details.name}</p>
        {:else}
          <div
            class="selected-deck-identity"
            style={`background-image:url(https://card-images.netrunnerdb.com/v2/small/${isCorp ? THE_SYNDICATE_NRDB_CODE : THE_CATALYST_NRDB_CODE}.jpg)`}
          ></div>
          <p class="mb-1">
            {isCorp ? "No corp selected" : "No runner selected"}
          </p>
        {/if}
      </li>
    </ul>
    <ul class="list-group list-group-flush overflow-auto" style="height: 24em;">
      {#each data.nrdbDecks.filter((d) => d.details.side_id === (isCorp ? "corp" : "runner")) as deck (deck.details.nrdb_uuid)}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render deckListItem(deck, isCorp)}
      {/each}
    </ul>
  {/snippet}
  
  {#if data.player && data.player.id !== 0}
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
              href={editMode
                ? resolve(`/tournaments/${params.tournamentId}/rounds`)
                : resolve(`/tournaments/${params.tournamentId}`)}
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
              bind:value={data.player.name}
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
              bind:value={data.player.pronouns}
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
                bind:checked={data.player.include_in_stream}
              />
              <label for="include_in_stream" class="form-check-label">
                Video coverage allowed
              </label>
            </div>
          {/if}
        </div>
  
        <div class="dontprint mt-sm-2">
          {#if editMode}
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
                <button
                  type="button"
                  class="btn btn-link"
                  onclick={toggleEditing}
                >
                  <FontAwesomeIcon icon="edit" />
                  Edit decks in place
                </button>
              {/if}
            </div>
          {/if}
  
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
  
    <!-- Deck selection -->
    {#if !editMode}
      <div class="alert alert-secondary dontprint">
        Please select from your decks below. <a
          href="https://netrunnerdb.com/en/decks"
          target="_blank">See your decks in NetrunnerDB</a
        >. Refresh the page to reload from NetrunnerDB.
      </div>
  
      <div class="row mb-3 justify-content-center dontprint">
        {#if data.nrdbDecks.length > 0}
          <div class="col-md-6">
            <div class="card" aria-label="NRDB corp decks">
              <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
              {@render decksList(true, corpDeck)}
            </div>
          </div>

          <div class="col-md-6">
            <div class="card" aria-label="NRDB runner decks">
              <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
              {@render decksList(false, runnerDeck)}
            </div>
          </div>
        {:else}
          <div class="alert alert-warning">
            You have no decks saved in NRDB.
          </div>
        {/if}
      </div>
    {/if}
  
    <!-- Deck display -->
    <div class="row">
      <div class="col-md-6">
        <DeckDisplay
          bind:deck={corpDeck}
          originalDeck={originalCorpDeck}
          isCorp={true}
          editMode={editing}
        />
      </div>
  
      <div class="col-md-6">
        <DeckDisplay
          bind:deck={runnerDeck}
          originalDeck={originalRunnerDeck}
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
