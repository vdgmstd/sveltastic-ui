/** Number of fraction digits implied by a step (e.g. `0.05` → 2). */
export function decimalsFromStep(step: number): number {
	if (!Number.isFinite(step) || step === 0) return 0;
	const str = Math.abs(step).toString();
	const dot = str.indexOf('.');
	return dot === -1 ? 0 : str.length - dot - 1;
}
