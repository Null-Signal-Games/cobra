<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { Round } from "$lib/model/Round";
  import { onMount } from "svelte";

  let {
    round,
    updateCallback,
  }: {
    round: Round;
    updateCallback?: (
      roundId: number,
      length_minutes: number,
      operation: string,
    ) => void;
  } = $props();

  let roundTimerLength = $state(0);

  onMount(() => {
    roundTimerLength = round.length_minutes;
  });
</script>

<div class="form-inline mt-2 round-timer-form">
  <div class="form-group">
    <label for="round{round.id}Length">Round timer length (minutes)</label>
    <input
      id="round{round.id}Length"
      size="3"
      class="form-control ml-2 mr-2"
      bind:value={roundTimerLength}
    />
    {#if round.timer.running}
      <button
        type="button"
        class="btn btn-danger"
        onclick={() => {
          updateCallback?.(round.id, roundTimerLength, "stop");
        }}
      >
        <FontAwesomeIcon icon="clock-o" /> Pause
      </button>
    {:else if round.timer.paused}
      <button
        type="button"
        class="btn btn-success"
        onclick={() => {
          updateCallback?.(round.id, roundTimerLength, "start");
        }}
      >
        <FontAwesomeIcon icon="clock-o" /> Resume
      </button>
    {:else if !round.timer.started}
      <button
        type="button"
        class="btn btn-success"
        onclick={() => {
          updateCallback?.(round.id, roundTimerLength, "start");
        }}
      >
        <FontAwesomeIcon icon="clock-o" /> Start
      </button>
    {/if}
    <button
      class="btn btn-info ml-2"
      onclick={() => {
        updateCallback?.(round.id, roundTimerLength, "reset");
      }}
    >
      <FontAwesomeIcon icon="undo" /> Reset
    </button>
  </div>
</div>
