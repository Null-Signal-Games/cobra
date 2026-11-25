import { describe, it, expect } from 'vitest';
import { makePairing, makePlayer, makeStage } from '#lib/testing/fixtures.ts';
import { readableReportScore, scorePresets, type ScoreReport } from './ScoreReport.ts';
import type { Stage } from './Stage.ts';

function report(overrides: Partial<ScoreReport>): ScoreReport {
	return {
		score1: null,
		score2: null,
		score1_corp: 0,
		score1_runner: 0,
		score2_corp: 0,
		score2_runner: 0,
		intentional_draw: false,
		...overrides
	};
}

describe('readableReportScore', () => {
	it('returns "-" when no score has been entered', () => {
		expect(readableReportScore(report({}), null, false)).toBe('-');
	});

	it('returns "0 - 0" for a 0-0 report', () => {
		expect(readableReportScore(report({ score1: 0, score2: 0 }), null, false)).toBe('0 - 0');
	});

	it('includes the winning side', () => {
		expect(
			readableReportScore(report({ score1: 3, score2: 0, score1_corp: 3 }), 'corp', true)
		).toBe('3 - 0 (C)');
	});
});

describe('scorePresets', () => {
	const sides = (p: ScoreReport) => [
		p.score1_corp,
		p.score1_runner,
		p.score2_corp,
		p.score2_runner
	];

	function presets(stage: Partial<Stage>, player1Side: string | null = null) {
		const opponentSide =
			player1Side === null ? null : player1Side === 'corp' ? 'runner' : 'corp';
		const pairing = makePairing({
			player1: makePlayer({ id: 1, name: 'sindarin', side: player1Side }),
			player2: makePlayer({ id: 2, name: 'lia', side: opponentSide })
		});
		return scorePresets(makeStage(stage), pairing);
	}

	it('offers both-sides results for double-sided swiss', () => {
		const result = presets({});

		expect(result.map((p) => [p.label, ...sides(p)])).toEqual([
			['6-0', 3, 3, 0, 0],
			['3-3 (C)', 3, 0, 3, 0],
			['3-3 (R)', 0, 3, 0, 3],
			['0-6', 0, 0, 3, 3]
		]);
	});

	it('offers single-sided swiss results with player 1 as corp', () => {
		const result = presets({ is_single_sided: true }, 'corp');

		expect(result.map((p) => [p.label, ...sides(p), p.intentional_draw])).toEqual([
			['Corp Win', 3, 0, 0, 0, false],
			['Tie', 1, 0, 0, 1, false],
			['Intentional Draw', 1, 0, 0, 1, true],
			['Runner Win', 0, 0, 0, 3, false]
		]);
	});

	it('offers single-sided swiss results with player 1 as runner', () => {
		const result = presets({ is_single_sided: true }, 'runner');

		expect(result.map((p) => [p.label, ...sides(p), p.intentional_draw])).toEqual([
			['Corp Win', 0, 0, 3, 0, false],
			['Tie', 0, 1, 1, 0, false],
			['Intentional Draw', 0, 1, 1, 0, true],
			['Runner Win', 0, 3, 0, 0, false]
		]);
	});

	it('credits the winning side in elimination with player 1 as corp', () => {
		const result = presets({ is_single_sided: true, is_elimination: true }, 'corp');

		expect(result.map((p) => [p.label, p.score1, p.score2, ...sides(p)])).toEqual([
			['3-0', 3, 0, 3, 0, 0, 0],
			['0-3', 0, 3, 0, 0, 0, 3]
		]);
		expect(result.map((p) => p.extra_self_report_label)).toEqual(['sindarin wins', 'lia wins']);
	});

	it('credits the winning side in elimination with player 1 as runner', () => {
		const result = presets({ is_single_sided: true, is_elimination: true }, 'runner');

		expect(result.map((p) => [p.label, p.score1, p.score2, ...sides(p)])).toEqual([
			['3-0', 0, 3, 0, 0, 3, 0],
			['0-3', 3, 0, 0, 3, 0, 0]
		]);
		expect(result.map((p) => p.extra_self_report_label)).toEqual(['lia wins', 'sindarin wins']);
	});

	it('offers plain 3-0 / 0-3 in elimination before sides are chosen', () => {
		const result = presets({ is_single_sided: true, is_elimination: true });

		expect(result.map((p) => [p.label, p.score1, p.score2, ...sides(p)])).toEqual([
			['3-0', 3, 0, 0, 0, 0, 0],
			['0-3', 0, 3, 0, 0, 0, 0]
		]);
	});
});
