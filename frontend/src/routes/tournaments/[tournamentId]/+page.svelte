<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ModalDialog from "$lib/components/ModalDialog.svelte";
  import { resolve } from "$app/paths";
  import type { PageProps } from "./$types";
  import { page } from "$app/state";
  import { authStore } from "$lib/utils/auth.svelte";
  import { swissFormatDisplayString } from "$lib/model/Tournament";
  import { onMount } from "svelte";
  import RegistrationCard from "./RegistrationCard.svelte";
  import Markdown from '@magidoc/plugin-svelte-marked'
  import { qr } from '@svelte-put/qr/svg';

  let { data }: PageProps = $props();

  let userId = $state(0);
  let tournament = $derived(data.tournamentData.tournament);
  let shortcodeUrl = $derived(tournament.slug ? `${page.url.origin}/${tournament.slug}` : "");

  let notices = $derived.by(() => {
    let notices: string[] = [];
    if (tournament.nrdb_deck_registration) {
      if (
        !tournament.registration_closed &&
        (data.player?.id === 0 || !data.player?.registration_locked)
      ) {
        notices.push("Registration is open.");
      }
      if (userId === tournament.user_id && tournament.any_player_unlocked) {
        notices.push("One or more players are unlocked for editing.");
      }
      if (data.player?.id !== 0 && !data.player?.registration_locked) {
        notices.push("Your registration is editable.");
      }
    }

    return notices;
  });

  function printQRCode() {
    const qrCodeDiv = document.getElementById("qrCode");
    if (!qrCodeDiv) {
      return;
    }

    const printWindow = window.open();
    if (!printWindow) {
      return;
    }
    printWindow.document.body.append(qrCodeDiv.cloneNode(true));
    printWindow.print();
    printWindow.close();
  }

  onMount(async () => {
    const user = await authStore.checkAuth();
    userId = user?.id ?? 0;
  });
</script>

{#if tournament.id === 0}
  <div class="d-flex align-items-center m-2">
    <div class="spinner-border m-auto"></div>
  </div>
{:else}
  <div class="container">
    <!-- Notices -->
    <div class="row">
      <div class="col-md-12">
        {#each notices as notice (notice)}
          <div class="alert alert-info">{notice}</div>
        {/each}
      </div>
    </div>

    <div class="row">
      <!-- Overview -->
      <div class="col-md-6">
        <div class="card">
          <!-- Shortcode -->
          {#if tournament.slug}
            <li class="list-group-item" aria-label="shortcode">
              <div class="small text-secondary">Shortcode:</div>
              {tournament.slug}
              (<a href={resolve(`/${tournament.slug}`)}>
                {shortcodeUrl}
              </a>)
            </li>
          {/if}

          <!-- Date -->
          <li class="list-group-item">
            <div aria-label="date">
              <div class="small text-secondary">Date:</div>
              {new Date(tournament.date).toLocaleString(navigator.languages, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </div>

            <div class="d-flex flex-wrap">
              {#if tournament.registration_starts}
                <div class="mr-4" aria-label="registration time">
                  <div class="small text-secondary">Registration:</div>
                  {new Date(tournament.registration_starts).toLocaleTimeString(
                    navigator.languages,
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </div>
              {/if}

              {#if tournament.tournament_starts}
                <div class="mr-4" aria-label="first round time">
                  <div class="small text-secondary">First Round:</div>
                  {new Date(tournament.tournament_starts).toLocaleTimeString(
                    navigator.languages,
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </div>
              {/if}

              {#if tournament.registration_starts ?? tournament.tournament_starts}
                <div style="align-self: flex-end" aria-label="time zone">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              {/if}
            </div>
          </li>

          <!-- Organiser -->
          <li class="list-group-item" aria-label="tournament organiser">
            <div class="small text-secondary">Organiser:</div>
            {`${tournament.tournament_organizer} ${tournament.organizer_contact ? `- ${tournament.organizer_contact}` : ""}`}
          </li>

          <!-- Players -->
          <li class="list-group-item" aria-label="player count">
            <div class="small text-secondary">Players:</div>
            {tournament.active_player_count}
            {new Intl.PluralRules(navigator.languages).select(
              tournament.active_player_count,
            ) == "one"
              ? "active player"
              : "active players"}
            ({tournament.dropped_player_count} dropped)
          </li>

          <!-- QR Code -->
          {#if shortcodeUrl}
            <li class="list-group-item">
              <div class="small text-secondary">QR Code:</div>
              <div class="row col-sm-6" aria-label="QR code">
                <button
                  type="button"
                  class="btn btn-link p-0"
                  data-toggle="modal"
                  data-target="#qrCodeDialog"
                >
                  <FontAwesomeIcon icon="qrcode" />
                  Open QR Code
                </button>

                <ModalDialog id="qrCodeDialog" headerText="QR Code">
                  <div class="text-center">
                    <button
                      type="button"
                      class="btn btn-primary mb-3"
                      onclick={printQRCode}
                    >
                      <FontAwesomeIcon icon="print" /> Print
                    </button>
                    <div id="qrCode">
                      <h4 class="mb-3">
                        {shortcodeUrl}
                      </h4>
                      <div class="d-inline-block bg-white p-3 rounded shadow-sm">
                        <svg
                          use:qr={{
                            data: shortcodeUrl,
                            anchorInnerFill: 'black',
                            anchorOuterFill: 'black',
                            moduleFill: 'black',
                            margin: 0.25,
                          }}
                          class="w-100 h-100"
                        />
                      </div>
                    </div>
                  </div>
                </ModalDialog>
              </div>
            </li>
          {/if}

          <!-- More Information -->
          {#if tournament.event_link}
            <li class="list-group-item">
              <div class="small text-secondary">More Information:</div>
              <a href={tournament.event_link} target="_blank" rel="external">{tournament.event_link}</a>
            </li>
          {/if}
        </div>
      </div>
      <!-- Registration -->
      <div class="col-md-6" aria-label="registration information">
        {#if data.player && data.player.id !== 0}
          {#if data.player.active}
            <!-- User is logged in and registered -->
            <RegistrationCard {userId} {tournament} player={data.player} csrfToken={data.tournamentData.csrf_token} />
          {:else}
            <h5 class="card-title">Rejoin this Event</h5>
            {#if userId === tournament.user_id}
              <p /* User is the Tournament Organizer (TO) and is registered, but is currently dropped */>
                You can reinstate yourself on the
                <a href={resolve(`/tournaments/${tournament.id}/organizer/players`)}>
                  Players
                </a>
                tab.
              </p>
            {:else}
              <p /* User is not the Tournament Organizer (TO) and is registered, but is currently dropped */>
                Talk to a Tournament Organiser to rejoin the event.
              </p>
            {/if}
          {/if}
        {:else if !tournament.registration_closed && tournament.self_registration}
          {#if authStore.isAuthenticated && data.player}
            <RegistrationCard /* User is logged in and not registered */
              {userId} {tournament} player={data.player} csrfToken={data.tournamentData.csrf_token} />
          {:else}
            <div class="card card-body alert alert-warning" /* User is not logged in and not registered */>
              <h5 class="card-title">Register for this Event</h5>

              <p class="mb-1">
                You must be logged in to register for this tournament:
              </p>
              <a
                class="alert-link"
                href={resolve(`/login?return_to=/tournaments/${tournament.id}`)}
              >
                <FontAwesomeIcon icon="sign-in" /> Sign in
              </a>

              <p class="mt-4 mb-1">
                Don't have an account? Register with NetrunnerDB, then return
                to Cobra to log in:
              </p>
              <a class="alert-link" href="https://netrunnerdb.com/register/">
                <i class="icon icon-link"></i> Create NRDB Account
              </a>
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Additional Details -->
    <div class="row mt-3" aria-label="additional details">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between">
            <h5 class="mb-0">Additional Details</h5>
          </div>
          
          <ul class="list-group list-group-flush">
            <!-- Description -->
            {#if tournament.description}
              <li class="list-group-item">
                <h5>Description</h5>
                <Markdown source={tournament.description} />
              </li>
            {/if}

            <!-- Format and Deckbuilding -->
            <li class="list-group-item">
              <h5>Format and Deckbuilding</h5>
              <div>Swiss Format: {swissFormatDisplayString(tournament.swiss_format)}</div>
              {#if tournament.format_id}
                <div>Game Format: {tournament.format_name}</div>
              {/if}
              {#if tournament.deckbuilding_restriction_id}
                <div>Deckbuilding Restrictions: {tournament.deckbuilding_restriction_name}</div>
              {/if}
              {#if tournament.decklist_required}
                <div>Decklists are required for this event.</div>
              {/if}
            </li>

            <!-- Prizes -->
            {#if tournament.official_prize_kit_id ?? tournament.additional_prizes_description}
              {#if tournament.official_prize_kit_id}
                <li class="list-group-item">
                  <h5>Official Prize Kit</h5>
                  <p>{tournament.official_prize_kit_name}</p>
                </li>
              {/if}
              {#if tournament.additional_prizes_description}
                <li class="list-group-item">
                  <h5>Additional Prizes</h5>
                  <Markdown source={tournament.additional_prizes_description} />
                </li>
              {/if}
            {/if}
          </ul>
        </div>
      </div>
    </div>
  </div>
{/if}
