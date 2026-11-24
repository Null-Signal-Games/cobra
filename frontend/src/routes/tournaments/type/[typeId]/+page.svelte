<script lang="ts">
	import type { PageProps } from './$types';
	import TournamentList from '../../TournamentList.svelte';

	// Quick SvelteKit lesson:
	// - data is a combination of the object returned by the load() method in
	//   +page.ts and its parents' load() objects (i.e. that of the main layout).
	// - params are the page parameters, in this case the [typeId] URL slug.
	let { data, params }: PageProps = $props();
</script>

<TournamentList
	typeId={parseInt(params.typeId)}
	tournamentsResponse={data.tournamentsResponse}
	tournamentTypes={data.tournamentTypes}
/>
