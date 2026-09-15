<script lang="ts">
  import type { PageProps } from "./$types";
  import StageSettings from "./StageSettings.svelte";

  let { data }: PageProps = $props();
</script>

<div class="col-12">
  <StageSettings
    tournamentId={data.tournamentId}
    stageId={data.stageId}
    initialData={data.stageData}
  />
</div>
