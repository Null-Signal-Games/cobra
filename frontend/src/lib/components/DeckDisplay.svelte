<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import Identity from "$lib/components/identity/Identity.svelte";
  import type { Card, Deck } from "$lib/model/Deck";
  import type { Printing } from "$lib/utils/api_types";
  import { deckCsv, transformCardLookup } from "$lib/utils/decks.svelte";
  import { downloadBlob } from "$lib/utils/files";
  import Svelecte from "svelecte";
  import { getCardTypeImage } from "$lib/utils/images";
  import EditableCard from "./EditableCard.svelte";

  interface CardSearchOption {
    label: string;
    value: Printing;
  }

  interface CardDiff {
    title: string;
    delta: number;
  }

  let {
    deck = $bindable(),
    originalDeck,
    isCorp,
    editMode,
  }: {
    deck?: Deck;
    originalDeck: Deck;
    isCorp: boolean;
    editMode: boolean;
  } = $props();

  let selectedCard = $state<Printing | null>(null);
  let cardDiffs = $state<CardDiff[]>([]);
  let cardTotal = $derived.by(() => {
    if (!deck) {
      return 0;
    }

    return deck.cards
      .filter((card: Card) => !card.card_type_id.endsWith("identity"))
      .reduce((total: number, card: Card) => total + card.quantity, 0);
  });
  let influenceTotal = $derived.by(() => {
    if (!deck) {
      return 0;
    }

    return deck.cards
      .filter((card: Card) => card.faction_id !== deck.details.faction_id)
      .reduce((total: number, card: Card) => total + card.influence, 0);
  });

  function getCardSearchUrl(sideId: string | null) {
    return `https://api.netrunnerdb.com/api/v3/public/printings?fields[printings]=card_id,card_type_id,title,side_id,faction_id,minimum_deck_size,influence_limit,influence_cost&filter[side_id]=${sideId}&filter[search]=[query]&filter[distinct_cards]=true`;
  }

  function adjustFactionId(factionId: string) {
    return factionId.replace("_", "-");
  }

  function diffDecks() {
    cardDiffs = [];

    if (!deck) {
      return;
    }

    // Identity
    if (originalDeck.details.identity_title !== deck.details.identity_title) {
      if (originalDeck.details.identity_title) {
        cardDiffs.push({
          title: originalDeck.details.identity_title,
          delta: -1,
        });
      }
      if (deck.details.identity_title) {
        cardDiffs.push({
          title: deck.details.identity_title,
          delta: 1,
        });
      }
    }

    // Removed cards and quantity changes
    originalDeck.cards.forEach((originalCard) => {
      const card = deck.cards.find(
        (c) => c.nrdb_card_id === originalCard.nrdb_card_id,
      );
      if (card) {
        if (card.quantity !== originalCard.quantity) {
          cardDiffs.push({
            title: originalCard.title,
            delta: card.quantity - originalCard.quantity,
          });
        }
      } else {
        cardDiffs.push({
          title: originalCard.title,
          delta: -originalCard.quantity,
        });
      }
    });

    // Added cards
    deck.cards.forEach((card) => {
      const originalCard = originalDeck.cards.find(
        (c) => c.nrdb_card_id === card.nrdb_card_id,
      );
      if (!originalCard) {
        cardDiffs.push({
          title: card.title,
          delta: card.quantity,
        });
      }
    });
  }

  async function copyToClipboard() {
    if (!deck) {
      return;
    }

    await navigator.clipboard.writeText(
      deck.cards.reduce(
        (text: string, card: Card) => `${text}${card.quantity} ${card.title}\n`,
        "",
      ),
    );
    alert("Copied to clipboard");
  }

  function downloadCsv() {
    if (!deck) {
      return;
    }

    downloadBlob(
      `${deck.details.player_name} - ${deck.details.name}.csv`,
      new Blob([deckCsv([deck])], { type: "text/csv" }),
    );
  }

  function changeIdentity(printing: Printing) {
    if (!deck || !printing.id) {
      return;
    }

    deck.details.identity_nrdb_printing_id = printing.id;
    deck.details.identity_nrdb_card_id = printing.attributes.card_id;
    deck.details.identity_title = printing.attributes.title;
    deck.details.faction_id = printing.attributes.faction_id;
    deck.details.min_deck_size = printing.attributes.minimum_deck_size;
    deck.details.max_influence = printing.attributes.influence_limit;

    diffDecks();
  }

  function changeCard(cardPrintingId: string | null, printing: Printing) {
    if (!cardPrintingId || !deck || !printing.id) {
      return;
    }

    const i = deck.cards.findIndex(
      (c) => c.nrdb_printing_id === cardPrintingId,
    );
    if (i < 0 || i >= deck.cards.length) {
      return;
    }

    deck.cards.splice(i, 1, {
      id: deck.cards[i].id,
      deck_id: deck.cards[i].deck_id,
      title: printing.attributes.title,
      quantity: deck.cards[i].quantity,
      influence:
        (printing.attributes.influence_cost ?? 0) * deck.cards[i].quantity,
      nrdb_card_id: printing.attributes.card_id,
      created_at: "",
      updated_at: "",
      nrdb_printing_id: deck.cards[i].nrdb_printing_id,
      card_type_id: printing.attributes.card_type_id,
      faction_id: printing.attributes.faction_id,
      influence_cost: printing.attributes.influence_cost ?? 0,
    });

    diffDecks();
  }

  function addCard(selection: CardSearchOption | null) {
    if (!deck || !selection?.value.id) {
      return;
    }

    if (!deck.cards.find((c) => c.nrdb_printing_id === selection.value.id)) {
      deck.cards.push({
        id: 0,
        deck_id: deck.details.id,
        title: selection.value.attributes.title,
        quantity: 1,
        influence: selection.value.attributes.influence_cost ?? 0,
        nrdb_card_id: selection.value.attributes.card_id,
        created_at: "",
        updated_at: "",
        nrdb_printing_id: selection.value.id,
        card_type_id: selection.value.attributes.card_type_id,
        faction_id: selection.value.attributes.faction_id,
        influence_cost: selection.value.attributes.influence_cost ?? 0,
      });
    }

    selectedCard = null;

    diffDecks();
  }



  function changeQuantity(card: Card, delta: number) {
    if (!deck) {
      return;
    }

    card.quantity += delta;
    card.influence = card.influence_cost * card.quantity;
    if (card.quantity === 0) {
      const i = deck.cards.indexOf(card);
      if (i !== -1) {
        deck.cards.splice(i, 1);
      }
    }

    diffDecks();
  }
</script>

<!-- Deck summary -->
<table
  class="table table-bordered table-striped"
  aria-label={isCorp ? "corp deck" : "runner deck"}
>
  <thead class="thead-dark">
    <tr>
      <th class="text-center deck-name-header">
        {isCorp ? "Corp Deck" : "Runner Deck"}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        {#if deck?.details.nrdb_uuid}
          {#if deck.details.name}
            {deck.details.name}
            <div class="float-right dontprint">
              <span class="dropdown">
                <button
                  type="button"
                  title="Export deck"
                  class="btn btn-link p-0"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon="download" />
                </button>
                <div class="dropdown-menu">
                  <button
                    type="button"
                    class="dropdown-item"
                    onclick={copyToClipboard}
                  >
                    Copy to clipboard in NetrunnerDB format
                  </button>
                  <button
                    type="button"
                    class="dropdown-item"
                    onclick={downloadCsv}
                  >
                    Download as a CSV spreadsheet
                  </button>
                </div>
              </span>
              {#if deck.details.mine}
                <a
                  href="https://netrunnerdb.com/en/deck/edit/{deck.details
                    .nrdb_uuid}"
                  target="_blank"
                  title="Edit Deck"
                  class="ml-2"
                >
                  <FontAwesomeIcon icon="external-link" />
                </a>
              {/if}
            </div>
          {:else}
            Unnamed deck
          {/if}
        {:else}
          No deck selected
        {/if}
      </td>
    </tr>
  </tbody>
</table>

{#if deck?.details.nrdb_uuid}
  <!-- Identity -->
  <table
    class="table table-bordered table-striped"
    aria-label={isCorp ? "corp deck ID" : "runner deck ID"}
  >
    <thead class="thead-dark">
      <tr>
        <th class="text-center deck-side-column">Min</th>
        <th class="text-center">Identity</th>
        <th class="text-center deck-side-column">Max</th>
      </tr>
    </thead>
    <tbody>
      <tr data-testid="identity_row">
        <td class="text-center align-middle">{deck.details.min_deck_size}</td>
        <td>
          <EditableCard
            sideId={deck.details.side_id ?? ""}
            isIdentity={true}
            allowEdit={editMode}
            onChange={changeIdentity}
          >
            <Identity
              identity={{
                name: deck.details.identity_title ?? "",
                faction: adjustFactionId(deck.details.faction_id ?? ""),
              }}
            />
          </EditableCard>
        </td>
        <td class="text-center align-middle">{deck.details.max_influence}</td>
      </tr>
    </tbody>
  </table>

  <!-- Deck list -->
  <table
    class="table table-bordered table-striped"
    aria-label={isCorp ? "corp deck list" : "runner deck list"}
  >
    <thead class="thead-dark">
      <tr>
        <th class="text-center deck-side-column">Qty</th>
        <th class="text-center">Card Name</th>
        <th class="text-center deck-side-column">Inf</th>
      </tr>
    </thead>
    <tbody>
      <!-- Cards -->
      {#each deck.cards as card (card.nrdb_card_id)}
        <tr data-testid="card_{card.nrdb_card_id}_row">
          <td class="text-center align-middle">
            {#if editMode}
              <button
                type="button"
                title="Remove"
                class="btn btn-link p-0"
                onclick={() => {
                  changeQuantity(card, -1);
                }}
              >
                <FontAwesomeIcon icon="minus" />
              </button>
            {/if}
            {card.quantity}
            {#if editMode}
              <button
                type="button"
                title="Add"
                class="btn btn-link p-0"
                onclick={() => {
                  changeQuantity(card, 1);
                }}
              >
                <FontAwesomeIcon icon="plus" />
              </button>
            {/if}
          </td>
          <td>
            <EditableCard
              sideId={deck.details.side_id ?? ""}
              isIdentity={false}
              allowEdit={editMode}
              onChange={(p: Printing) => {
                changeCard(card.nrdb_printing_id, p);
              }}
            >
              <img
                src={getCardTypeImage(card.card_type_id)}
                alt={card.card_type_id}
              />
              <i
                class="fa icon icon-{adjustFactionId(
                  card.faction_id,
                )} {adjustFactionId(card.faction_id)}"
              ></i>
              {card.title}
            </EditableCard>
          </td>
          <td class="text-center align-middle">
            {#if card.influence_cost && card.faction_id != deck.details.faction_id}
              {card.influence_cost * card.quantity}
            {/if}
          </td>
        </tr>
      {/each}
      {#if editMode}
        <tr data-testid="new_card_row">
          <td></td>
          <td>
            <Svelecte
              controlClass="form-control"
              placeholder="Enter card name"
              fetch={getCardSearchUrl(deck.details.side_id)}
              fetchCallback={transformCardLookup}
              labelField="label"
              valueField="value"
              bind:value={selectedCard}
              onChange={addCard}
            />
          </td>
          <td></td>
        </tr>
      {/if}

      <!-- Totals -->
      <tr>
        <td class="text-center deck-side-column">{cardTotal}</td>
        <td
          class="text-center"
          style="color: #FFFFFF; background-color: #343A40;"
        >
          Totals
        </td>
        <td class="text-center deck-side-column">{influenceTotal}</td>
      </tr>
    </tbody>
  </table>

  <!-- Editing diffs -->
  {#if editMode}
    <table
      class="table table-bordered table-striped"
      aria-label={isCorp ? "corp deck changes" : "runner deck changes"}
    >
      <thead class="thead-dark">
        <tr>
          <th class="text-center">Changes</th>
          <th class="text-center deck-side-column">Qty</th>
        </tr>
      </thead>
      <tbody>
        {#if cardDiffs.length === 0}
          <tr>
            <td colspan="2">No changes</td>
          </tr>
        {:else}
          {#each cardDiffs as diff (diff.title)}
            <tr>
              <td>{diff.title}</td>
              <td class="text-center align-middle">
                {diff.delta > 0 ? "+" : ""}{diff.delta}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  {/if}
{/if}
