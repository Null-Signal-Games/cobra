// Dark mode theme store for Cobra (beta Svelte surface).
// Uses Svelte 5 runes. Reads/writes localStorage key 'cobra-theme'
// and applies data-theme to <html>.
//
// The initial theme is set by an inline script in app.html
// to prevent flash-of-wrong-theme before stylesheets load.

const STORAGE_KEY = 'cobra-theme';

function getInitialTheme(): 'light' | 'dark' {
	if (typeof localStorage === 'undefined') return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	if (
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
	) {
		return 'dark';
	}
	return 'light';
}

class ThemeState {
	current = $state<'light' | 'dark'>(getInitialTheme());

	toggle() {
		this.current = this.current === 'light' ? 'dark' : 'light';
		localStorage.setItem(STORAGE_KEY, this.current);
		document.documentElement.setAttribute('data-theme', this.current);
	}

	/** Call once from the root layout's onMount to set the initial attribute
	 *  and register the OS preference listener. */
	init() {
		document.documentElement.setAttribute('data-theme', this.current);

		// Keep in sync when the user changes their OS preference,
		// but only if they have not explicitly set a preference in this app.
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (!localStorage.getItem(STORAGE_KEY)) {
				this.current = e.matches ? 'dark' : 'light';
				document.documentElement.setAttribute('data-theme', this.current);
			}
		});
	}
}

export const theme = new ThemeState();
