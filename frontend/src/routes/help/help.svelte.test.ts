import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import HelpPage from './+page.svelte';

describe('Help Page', () => {
	it('renders properly', () => {
		const { getByRole } = render(HelpPage);

		const heading = getByRole('heading', { level: 1, name: 'How to use Cobra' });
		expect(heading).toBeDefined();
	});
});
