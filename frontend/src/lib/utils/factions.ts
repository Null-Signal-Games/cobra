interface Faction {
	displayName: string;
	color: string;
}

const UnspecifiedFaction: Faction = {
	displayName: 'Unspecified',
	color: 'charcoal'
};

export const Factions = new Map<string, Faction>([
	['anarch', { displayName: 'Anarch', color: 'orangered' }],
	['criminal', { displayName: 'Criminal', color: 'royalblue' }],
	['shaper', { displayName: 'Shaper', color: 'limegreen' }],
	['adam', { displayName: 'Adam', color: 'olive' }],
	['apex', { displayName: 'Apex', color: '#C25048' }],
	['sunny-lebeau', { displayName: 'Sunny Lebeau', color: '#886E8F' }],
	['haas-bioroid', { displayName: 'Haas-Bioroid', color: 'blueviolet' }],
	['jinteki', { displayName: 'Jinteki', color: 'crimson' }],
	['neutral-corp', { displayName: 'Neutral', color: 'lightgrey' }],
	['neutral-runner', { displayName: 'Neutral', color: 'lightgrey' }],
	['nbn', { displayName: 'NBN', color: 'darkorange' }],
	['weyland-consortium', { displayName: 'Weyland Consortium', color: 'darkgreen' }],
	['unspecified', UnspecifiedFaction]
]);

export function getFaction(key: string) {
	return Factions.get(key) ?? UnspecifiedFaction;
}
