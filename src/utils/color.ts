import type { Color, ColorName } from '../types';

const PALETTE: ReadonlySet<ColorName> = new Set([
	'primary',
	'success',
	'danger',
	'warning',
	'info',
	'dark',
	'light',
	'facebook',
	'twitter',
	'youtube',
	'pinterest',
	'linkedin',
	'snapchat',
	'whatsapp',
	'tumblr',
	'reddit',
	'spotify',
	'amazon',
	'medium',
	'vimeo',
	'skype',
	'dribbble',
	'slack',
	'yahoo',
	'twitch',
	'discord',
	'telegram',
	'google-plus',
	'messenger'
]);

/** The CSS token for the warning palette is `--warn`; the friendlier `'warning'` enum maps to it at runtime. */
const TOKEN_ALIAS: Record<string, string> = { warning: 'warn' };

export function isPaletteName(value: string): value is ColorName {
	return PALETTE.has(value as ColorName);
}

function hexToTriplet(hex: string): string | null {
	let h = hex.replace(/^#/, '');
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	if (h.length !== 6) return null;
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
	return `${r} ${g} ${b}`;
}

function rgbToTriplet(value: string): string | null {
	const match = value.match(/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/i);
	if (!match) return null;
	return `${match[1]} ${match[2]} ${match[3]}`;
}

function rawTripletToTriplet(value: string): string | null {
	const match = value.match(/^\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*$/);
	if (!match) return null;
	return `${match[1]} ${match[2]} ${match[3]}`;
}

/**
 * Returns an `R G B` triplet usable inside `rgb(var(--c) / <alpha>)`.
 * `'primary'` → `var(--primary)` so palette lookups stay live (theme switch updates instantly).
 */
export function rgbTriplet(color: Color | undefined): string {
	if (!color) return 'var(--primary)';
	if (typeof color !== 'string') return 'var(--primary)';
	if (isPaletteName(color)) {
		const token = TOKEN_ALIAS[color] ?? color;
		return `var(--${token})`;
	}
	/* `var(--xxx)` and bare `--xxx` pass through — caller is opting into a live CSS var triplet. */
	if (color.startsWith('var(')) return color;
	if (color.startsWith('--')) return `var(${color})`;
	if (color.startsWith('#')) return hexToTriplet(color) ?? 'var(--primary)';
	if (color.startsWith('rgb')) return rgbToTriplet(color) ?? 'var(--primary)';
	const raw = rawTripletToTriplet(color);
	if (raw) return raw;
	return 'var(--primary)';
}

/** Full `rgb()` / `rgba()` string for cases where a complete color is needed (rare in the kit). */
export function cssColor(color: Color | undefined, alpha = 1): string {
	const triplet = rgbTriplet(color);
	return alpha >= 1 ? `rgb(${triplet})` : `rgb(${triplet} / ${alpha})`;
}
