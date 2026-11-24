export class Identity {
	name = '';
	faction: string | null = null;
}

export interface IdentityName {
	label: string;
	value: string;
}

export interface IdentityNames {
	corp: IdentityName[];
	runner: IdentityName[];
}
