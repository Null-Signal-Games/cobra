<script lang="ts">
  import FontAwesomeIcon from "#lib/components/FontAwesomeIcon.svelte";
  import ModalDialog from "#lib/components/ModalDialog.svelte";
  import type { RoundTimer } from "#lib/model/Round.ts";
  import { onMount } from "svelte";

  let { timer }: { timer: RoundTimer } = $props();

  let millis = $state(0);
  let minutes = $state(0);
  let seconds = $state(0);
  let alertClass = $state("alert-primary");

  let intervalID = 0;

  function updateTimer() {
    if (timer.paused) {
      millis = (timer.state.remaining_seconds ?? 0) * 1000;
    } else if (timer.started) {
      millis = new Date(timer.state.finish_time ?? "").getTime() - new Date().getTime();
    } else {
      millis = (timer.state.length_minutes ?? 0) * 60000;
    }

    const totalSeconds = Math.abs(Math.ceil(millis / 1000));
    minutes = Math.min(Math.trunc(totalSeconds / 60), 99);
    seconds = minutes > 99 ? 99 : totalSeconds % 60;

    if (timer.paused) {
      alertClass = "alert-secondary";
    } else if (millis < 1 * 60 * 1000) {
      alertClass = "alert-danger";
    } else if (millis < 5 * 60 * 1000) {
      alertClass = "alert-warning";
    } else {
      alertClass = "alert-primary";
    }
  }

  onMount(() => {
    updateTimer();

    if (timer.started && intervalID === 0) {
      intervalID = window.setInterval(updateTimer, 100);
    }

    return () => {
      clearInterval(intervalID);
    };
  });
</script>

<div>
  <div class="alert {alertClass} mb-0">
    <button class="btn btn-link alert-link p-0" style="text-decoration: none;" data-toggle="modal" data-target="#timerDialog">
      <FontAwesomeIcon icon="clock" />
      {millis < 0 ? "Overtime" : "Remaining"} in round{timer.paused ? " (paused)" : ""}:
      <span class="text-left alert-link" style="width: 2.6rem; display: inline-block; text-decoration: none;">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </button>
  </div>
  
  <ModalDialog id="timerDialog" headerText="Round Timer" dialogClass="modal-xl">
    <p class="text-center" style="font-size: 2vw">
      {millis < 0 ? "Overtime" : "Remaining"} in round{timer.paused ? " (paused)" : ""}:
    </p>
    <div class="alert alert-primary mb-0" style="font-size: 12vw; border-radius: 2vw; padding 0.5vw 4vw;">
      <FontAwesomeIcon icon="clock-o" />
      <span class="text-left" style="display: inline-block;">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  </ModalDialog>
</div>
