<script lang="ts">
	import type { PageProps } from './$types';
	import TournamentList from './TournamentList.svelte';

	let { data }: PageProps = $props();
</script>

<TournamentList
	tournamentsResponse={data.tournamentsResponse}
	tournamentTypes={data.tournamentTypes}
/>
