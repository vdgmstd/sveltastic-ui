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

function parseTriplet(color: string): string | null {
	if (color.startsWith('#')) return hexToTriplet(color);
	if (color.startsWith('rgb')) return rgbToTriplet(color);
	return rawTripletToTriplet(color);
}

/** Custom-property name behind `var(--x)` / `--x`, without the leading dashes. */
function customPropertyName(color: string): string | null {
	if (color.startsWith('--')) return color.slice(2);
	const match = color.match(/^var\(\s*--([\w-]+)/);
	return match ? match[1] : null;
}

const FALLBACK_TRIPLET = 'var(--primary)';
const INK = 'var(--on-accent)';
const INK_DARK = 'var(--on-accent-dark)';

/**
 * Returns an `R G B` triplet usable inside `rgb(var(--c) / <alpha>)`.
 * `'primary'` → `var(--primary)` so palette lookups stay live (theme switch updates instantly).
 */
export function rgbTriplet(color: Color | undefined): string {
	if (!color) return FALLBACK_TRIPLET;
	if (typeof color !== 'string') return FALLBACK_TRIPLET;
	if (isPaletteName(color)) {
		const token = TOKEN_ALIAS[color] ?? color;
		return `var(--${token})`;
	}
	/* `var(--xxx)` and bare `--xxx` pass through — caller is opting into a live CSS var triplet. */
	if (color.startsWith('var(')) return color;
	if (color.startsWith('--')) return `var(${color})`;
	return parseTriplet(color) ?? FALLBACK_TRIPLET;
}

function channelLuminance(value: number): number {
	const c = value / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// WCAG contrast of the white default ink against the fill. Above it the kit's accents keep white
// (success/info/danger sit here by design); below it white is unreadable and the dark ink takes over.
const MIN_INK_CONTRAST = 2;

function needsDarkInk(triplet: string): boolean {
	const [r, g, b] = triplet.split(' ').map(Number);
	const luminance =
		0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
	return 1.05 / (luminance + 0.05) < MIN_INK_CONTRAST;
}

function inkToken(token: string): string {
	return `var(--on-${token}, ${INK})`;
}

/**
 * Returns the ink triplet that stays readable over `color` as a fill — the `--on-c` companion of
 * `rgbTriplet`. Token-backed colours defer to `--on-<token>` (overridable per palette), resolvable
 * ones are decided by relative luminance.
 */
export function onAccentFor(color: Color | undefined): string {
	if (!color || typeof color !== 'string') return INK;
	if (isPaletteName(color)) return inkToken(TOKEN_ALIAS[color] ?? color);
	const name = customPropertyName(color);
	if (name) return inkToken(name);
	const triplet = parseTriplet(color);
	return triplet !== null && needsDarkInk(triplet) ? INK_DARK : INK;
}
