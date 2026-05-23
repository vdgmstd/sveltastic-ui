import type { Action } from 'svelte/action';
import { MaskInput, tokens as defaultTokens, type MaskInputOptions, type MaskaDetail } from 'maska';

export type MaskOptions = MaskInputOptions | string | string[];

export type { MaskaDetail };

function normalize(opts: MaskOptions): MaskInputOptions {
	return typeof opts === 'string' || Array.isArray(opts) ? { mask: opts } : opts;
}

/** Per-token slot characters used by `maskHint`. Default tokens get semantic placeholders; unknown tokens fall back to `·`. */
export const defaultMaskSlots: Record<string, string> = {
	'#': '0',
	'@': 'A',
	'*': '*'
};

/**
 * Build a placeholder hint from a mask pattern — token chars become slot characters, literals are kept.
 * `slot` is either a single character used for every token, or a per-token map; unmapped tokens fall back to `·`.
 * Returns `''` for function masks, dynamic alternatives without a single resolved pattern, or empty masks.
 */
export function maskHint(
	opts: MaskOptions | undefined,
	slot: string | Record<string, string> = defaultMaskSlots
): string {
	if (opts === undefined) return '';
	const normalized = normalize(opts);
	const raw = normalized.mask;
	let pattern: string | null = null;
	if (typeof raw === 'string') pattern = raw;
	else if (Array.isArray(raw)) pattern = raw.length === 1 ? (raw[0] ?? null) : null;
	if (!pattern) return '';

	const merged = normalized.tokensReplace
		? (normalized.tokens ?? {})
		: { ...defaultTokens, ...(normalized.tokens ?? {}) };

	const slotFor = (ch: string): string =>
		typeof slot === 'string' ? slot : (slot[ch] ?? '·');

	let out = '';
	for (let i = 0; i < pattern.length; i++) {
		const ch = pattern[i];
		if (ch === '!' && pattern[i - 1] !== '!') continue;
		if (i > 0 && pattern[i - 1] === '!') {
			out += ch;
			continue;
		}
		out += merged[ch] != null ? slotFor(ch) : ch;
	}
	return out;
}

export const mask: Action<HTMLInputElement | HTMLTextAreaElement, MaskOptions | undefined> = (
	node,
	options
) => {
	let instance: MaskInput | null = null;

	function apply(next: MaskOptions | undefined): void {
		if (next === undefined || (typeof next !== 'string' && !Array.isArray(next) && next.mask == null)) {
			instance?.destroy();
			instance = null;
			return;
		}
		const normalized = normalize(next);
		if (instance) instance.update(normalized);
		else instance = new MaskInput(node as HTMLInputElement, normalized);
	}

	apply(options);

	return {
		update: apply,
		destroy() {
			instance?.destroy();
			instance = null;
		}
	};
};
