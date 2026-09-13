<script lang="ts">
  import type { PageProps } from "./$types";
  import GlobalMessages from "$lib/components/GlobalMessages.svelte";
  import DangerActionCard from "./DangerActionCard.svelte";
  import { deleteStage, deleteTournament } from "../../api_helper";
  import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { resolve } from "$app/paths";

  let { data }: PageProps = $props();

  async function handleDeleteTournament(confirmationName: string): Promise<boolean> {
    const success = await deleteTournament(
      data.tournamentData.tournament.id,
      confirmationName,
      data.tournamentData.csrf_token,
    );
    if (success) {
      await goto(resolve("/tournaments"));
      return true;
    }
    return false;
  }

  async function handleDeleteStage(stageId: number, confirmationName: string): Promise<boolean> {
    const success = await deleteStage(
      data.tournamentData.tournament.id,
      stageId,
      confirmationName,
      data.tournamentData.csrf_token,
    );
    if (success) {
      globalMessages.infos = ["Stage deleted."];
      await invalidateAll();
      return true;
    }
    return false;
  }
</script>

<div class="col-12">
  <GlobalMessages />

  <DangerActionCard
    title="Delete Entire Tournament"
    entityType="tournament"
    instructionsText="If you are sure you want to delete this tournament, please type the tournament name exactly below, click &quot;Delete Tournament&quot;, and then confirm."
    expectedName={data.tournamentData.tournament.name}
    buttonLabel="Delete Tournament"
    inputId="tournament_name"
    buttonId="delete_tournament_button"
    onDelete={handleDeleteTournament}
  />

  {#each data.stages as stage (stage.id)}
    <DangerActionCard
      title="Delete {stage.name} Stage"
      entityType="stage"
      instructionsText={`If you are sure you want to delete this stage, please type the tournament name exactly below, click &quot;Delete ${stage.name} Stage&quot;, and then confirm.`}
      expectedName={data.tournamentData.tournament.name}
      buttonLabel="Delete {stage.name} Stage"
      inputId="tournament_stage_name_{stage.id}"
      buttonId="delete_stage_button_{stage.id}"
      onDelete={(name: string) => handleDeleteStage(stage.id, name)}
    />
  {/each}
</div>
