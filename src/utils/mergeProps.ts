import { cn } from './cn';

type Props = Record<string, unknown>;

const isEventHandler = (key: string, value: unknown): value is (...args: unknown[]) => unknown =>
	key.length > 2 && key[0] === 'o' && key[1] === 'n' && typeof value === 'function';

/** Merge prop bags left-to-right: `class` resolves via `cn` (conflicts → later wins), same-named `on*` handlers chain, symbol keys (attachments) pass through, everything else is last-wins. */
export function mergeProps(...bags: Array<Props | undefined | null>): Props {
	const out: Props = {};
	for (const bag of bags) {
		if (!bag) continue;
		for (const key in bag) {
			const value = bag[key];
			// Nullish never clobbers an earlier value — a later bag's undefined means "unset", not "force-clear".
			if (value == null && key !== 'class') {
				if (!(key in out)) out[key] = value;
				continue;
			}
			if (key === 'class') {
				out.class = cn(out.class as string | undefined, value as string | undefined) || undefined;
			} else if (isEventHandler(key, value)) {
				const prev = out[key];
				if (typeof prev === 'function') {
					const a = prev as (...args: unknown[]) => unknown;
					const b = value;
					out[key] = (...args: unknown[]) => {
						a(...args);
						return b(...args);
					};
				} else {
					out[key] = value;
				}
			} else {
				out[key] = value;
			}
		}
		// Symbol keys (Svelte attachment keys from createAttachmentKey) skip for-in — carry them through.
		const symBag = bag as Record<symbol, unknown>;
		const symOut = out as Record<symbol, unknown>;
		for (const sym of Object.getOwnPropertySymbols(bag)) symOut[sym] = symBag[sym];
	}
	return out;
}
