<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, type AuthUser } from "#lib/utils/auth.svelte.ts";

  let user = $state<AuthUser | null>(null);
  let isLoading = $state<boolean>(true);

  onMount(async () => {
    user = await authStore.checkAuth();
    if (!user) {
      const currentUrl = window.location.origin + window.location.pathname;
      authStore.redirectToLogin(currentUrl);
      return;
    }

    isLoading = false;
  });
</script>

<div class="container mt-4">
  {#if isLoading}
    <div class="d-flex justify-content-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only">Loading profile...</span>
      </div>
    </div>
  {:else if user}
    <h2 class="mb-4">My Profile - WIP</h2>

    <div class="d-flex flex-row align-items-center mb-5">
      <div
        class="rounded-circle bg-primary mr-4"
        style="width: 100px; height: 100px;"
      ></div>

      <div class="d-flex flex-fill">
        <div class="text-center mr-4">
          <div class="h4 font-weight-bold">0</div>
          <small class="text-muted">Tournaments</small>
        </div>
        <div class="text-center mr-4">
          <div class="h4 font-weight-bold">0</div>
          <small class="text-muted">Wins</small>
        </div>
        <div class="text-center">
          <div class="h4 font-weight-bold">0%</div>
          <small class="text-muted">Win Rate</small>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-4">
        <h3 class="h5 mb-3">Today</h3>
        <div>
          <p>Here you will find today's tournament, tables and pairings.</p>
        </div>
      </div>

      <div class="col-md-4">
        <h3 class="h5 mb-3">Past Tournaments</h3>
        <div>
          <p>Here you will find your past tournaments.</p>
        </div>
      </div>

      <div class="col-md-4">
        <h3 class="h5 mb-3">Upcoming Tournaments</h3>
        <div>
          <p>Here you will find upcoming tournaments you are registered for.</p>
        </div>
      </div>
    </div>
  {/if}
</div>

