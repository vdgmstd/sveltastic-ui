import type { Action } from 'svelte/action';
import { Tween } from 'svelte/motion';
import { cubicOut, quintOut } from 'svelte/easing';
import { rgbTriplet } from '../utils/color';
import type { Color } from '../types';

// Soft accent "bloom" ripple driven by svelte/motion Tweens; the action owns the Tweens + nodes and releases them on destroy.

export type RippleOptions = {
	/** Accent colour for this ripple. */
	color?: Color;
	/** Skip ripple emission entirely. */
	disabled?: boolean;
	/** Host surface IS the accent (filled buttons); lifts the disc so the wave stays visible. Flat/border/line: leave `false`. */
	solidBg?: boolean;
	/** Soft translucent variant (`rgb(--c / 0.18)`); tune alpha per-host via `--ripple-soft-alpha`. */
	soft?: boolean;
	/** Ink-in / fade duration (ms). Default scales with host width (`>150px → 750ms`, else `550ms`). */
	duration?: number;
	/** Spawn origin relative to host top-left; function form is evaluated at spawn time. */
	origin?: { x: number; y: number } | ((host: HTMLElement) => { x: number; y: number });
	/** Layer clip radius, for hosts whose `border-radius` changes mid-ripple (e.g. range-start cells). */
	radius?: string;
	/** Only spawn when `mousedown.target.closest(trigger)` matches inside the host. */
	trigger?: string;
	/** Mount the visual layer here instead of the host; click capture stays on the host. */
	mountTo?: HTMLElement;
	/** Host text colour during the bloom. Defaults to `rgb(var(--on-accent))`; `'currentColor'` disables the shift. */
	textColor?: Color | 'currentColor';
};

const HOST_CLASS = 'ripple-host';
const SHEET_ID = 'sveltastic-ui-ripple-styles';
const STYLES = `
.${HOST_CLASS} { position: relative; isolation: isolate; }

:where(.${HOST_CLASS}) > :where(*:not(.ripple__layer)) {
	position: relative;
	z-index: 2;
}

.ripple__layer {
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
	z-index: 1;
	border-radius: inherit;
}

.ripple__effect {
	position: absolute;
	width: var(--ripple-size);
	height: var(--ripple-size);
	border-radius: var(--rad-circle);
	pointer-events: none;
	background: radial-gradient(circle,
		rgb(var(--sa-color, 25 91 255)) 0%,
		rgb(var(--sa-color, 25 91 255)) 78%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 16%) 92%,
		rgb(var(--sa-color, 25 91 255)) 100%);
	will-change: transform, opacity;
	contain: layout paint style;
	backface-visibility: hidden;
	transform-origin: center;
}

[data-theme='dark'] .ripple__effect {
	background: radial-gradient(circle,
		rgb(var(--sa-color, 25 91 255)) 0%,
		rgb(var(--sa-color, 25 91 255)) 78%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 24%) 92%,
		rgb(var(--sa-color, 25 91 255)) 100%);
}

.ripple__effect--on-fill {
	background: radial-gradient(circle,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 6%) 0%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 14%) 35%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 24%) 70%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 42%) 92%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 14%) 100%);
}

[data-theme='dark'] .ripple__effect--on-fill {
	background: radial-gradient(circle,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 18%) 0%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 26%) 35%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 38%) 70%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 56%) 92%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 26%) 100%);
}

.ripple__effect--soft {
	background: radial-gradient(circle,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.18)) 0%,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.18)) 78%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255) / 0.18), white 24%) 92%,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.18)) 100%);
}

[data-theme='dark'] .ripple__effect--soft {
	background: radial-gradient(circle,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.24)) 0%,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.24)) 78%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255) / 0.24), white 30%) 92%,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.24)) 100%);
}
`;

function installStyles(): void {
	if (typeof document === 'undefined') return;
	let style = document.getElementById(SHEET_ID) as HTMLStyleElement | null;
	if (style) {
		if (style.textContent !== STYLES) style.textContent = STYLES;
		return;
	}
	style = document.createElement('style');
	style.id = SHEET_ID;
	style.textContent = STYLES;
	document.head.appendChild(style);
}

export const ripple: Action<HTMLElement, RippleOptions | undefined> = (host, initial) => {
	let opts: RippleOptions = initial ?? {};
	const ac = new AbortController();
	const { signal } = ac;
	const liveStops = new Set<() => void>();
	let activeRipples = 0;
	let restActive = false;

	const fill = new Tween(0, { duration: 200, easing: cubicOut });
	let restRGB: [number, number, number] | null = null;
	let targetRGB: [number, number, number] | null = null;
	const fillStop = $effect.root(() => {
		$effect(() => {
			const rp = fill.current;
			host.style.setProperty('--rp', String(rp));
			// JS lerp (not color-mix/oklab) so the text-color shift also applies in Safari/WebKit.
			if (restRGB && targetRGB) {
				const r = Math.round(restRGB[0] + (targetRGB[0] - restRGB[0]) * rp);
				const g = Math.round(restRGB[1] + (targetRGB[1] - restRGB[1]) * rp);
				const b = Math.round(restRGB[2] + (targetRGB[2] - restRGB[2]) * rp);
				host.style.setProperty('color', `rgb(${r} ${g} ${b})`);
			}
		});
	});
	liveStops.add(fillStop);

	installStyles();
	host.classList.add(HOST_CLASS);

	function resolveAccentTriplet(): string {
		if (opts.color) return rgbTriplet(opts.color);
		const styles = getComputedStyle(host);
		const fromSa = styles.getPropertyValue('--sa-color').trim();
		if (fromSa) return fromSa;
		const fromC = styles.getPropertyValue('--c').trim();
		return fromC || '25 91 255';
	}

	function parseRgb(s: string): [number, number, number] | null {
		const m = s.match(/-?\d*\.?\d+/g);
		return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : null;
	}

	function resolveTargetRGB(cs: CSSStyleDeclaration): [number, number, number] | null {
		if (opts.textColor === 'currentColor') return null;
		let triplet: string;
		if (opts.textColor) {
			triplet = rgbTriplet(opts.textColor);
			if (triplet.startsWith('var('))
				triplet = cs.getPropertyValue(triplet.slice(4, -1).trim()).trim();
		} else {
			triplet = cs.getPropertyValue('--on-accent').trim() || '255 255 255';
		}
		return parseRgb(triplet);
	}

	function activateRest(): void {
		if (restActive) return;
		const cs = getComputedStyle(host);
		const target = resolveTargetRGB(cs);
		if (target === null) return;
		const rest = parseRgb(cs.color);
		if (rest === null) return;
		// Solid hosts already wear the target text colour — skip the per-frame shift (perf).
		if (rest[0] === target[0] && rest[1] === target[1] && rest[2] === target[2]) return;
		restRGB = rest;
		targetRGB = target;
		restActive = true;
	}

	function deactivateRest(): void {
		if (!restActive) return;
		host.style.removeProperty('color');
		host.style.removeProperty('--rp');
		restRGB = null;
		targetRGB = null;
		restActive = false;
	}

	function spawn(evt: MouseEvent): void {
		if (opts.disabled) return;
		if (evt.button !== 0) return;
		if (opts.trigger) {
			const target = evt.target as Element | null;
			if (!target || !target.closest(opts.trigger)) return;
		}

		const r = host.getBoundingClientRect();
		let x: number;
		let y: number;
		if (opts.origin) {
			const o = typeof opts.origin === 'function' ? opts.origin(host) : opts.origin;
			x = o.x;
			y = o.y;
		} else {
			x = evt.clientX - r.left;
			y = evt.clientY - r.top;
		}
		const w = host.clientWidth;
		const h = host.clientHeight;
		const size = Math.ceil(
			Math.max(
				Math.hypot(x, y),
				Math.hypot(w - x, y),
				Math.hypot(x, h - y),
				Math.hypot(w - x, h - y)
			) * 2.5
		);
		const inkDuration = opts.duration ?? (w > 150 ? 750 : 550);

		const layer = document.createElement('span');
		layer.className = 'ripple__layer';
		if (opts.radius) layer.style.borderRadius = opts.radius;
		const node = document.createElement('span');
		node.className = 'ripple__effect';
		if (opts.color) node.style.setProperty('--sa-color', rgbTriplet(opts.color));
		if (opts.solidBg) node.classList.add('ripple__effect--on-fill');
		if (opts.soft) node.classList.add('ripple__effect--soft');
		node.style.setProperty('--ripple-size', `${size}px`);
		node.style.left = `${x}px`;
		node.style.top = `${y}px`;
		layer.appendChild(node);
		const mount = opts.mountTo ?? host;
		mount.appendChild(layer);
		if (!opts.mountTo) layer.style.zIndex = '-1';

		const scale = new Tween(0, { duration: inkDuration, easing: cubicOut });
		const opacity = new Tween(0, { duration: 180, easing: cubicOut });

		const stop = $effect.root(() => {
			$effect(() => {
				node.style.transform = `translate(-50%, -50%) scale(${scale.current})`;
				node.style.opacity = String(opacity.current);
			});
		});
		liveStops.add(stop);

		let disposed = false;
		function cleanup(): void {
			if (disposed) return;
			disposed = true;
			signal.removeEventListener('abort', cleanup);
			stop();
			liveStops.delete(stop);
			layer.remove();
			if (activeRipples === 0) deactivateRest();
		}

		signal.addEventListener('abort', cleanup, { once: true });

		activeRipples++;
		activateRest();
		fill.set(1, { duration: inkDuration, easing: cubicOut });

		const fadeDuration = Math.round(inkDuration * 1.1);

		void (async () => {
			await Promise.all([
				opacity.set(1, { duration: 180, easing: cubicOut }),
				scale.set(1, { duration: inkDuration, easing: cubicOut })
			]);
			if (signal.aborted) {
				activeRipples = Math.max(0, activeRipples - 1);
				if (activeRipples === 0) fill.set(0, { duration: fadeDuration, easing: quintOut });
				return;
			}
			activeRipples = Math.max(0, activeRipples - 1);
			if (activeRipples === 0) fill.set(0, { duration: fadeDuration, easing: quintOut });
			await Promise.all([
				scale.set(1.55, { duration: fadeDuration, easing: quintOut }),
				opacity.set(0, { duration: fadeDuration, easing: quintOut })
			]);
			cleanup();
		})();
	}

	host.addEventListener('mousedown', spawn, { signal });

	return {
		update(next) {
			opts = next ?? {};
		},
		destroy() {
			ac.abort();
			deactivateRest();
			host.classList.remove(HOST_CLASS);
			for (const s of liveStops) s();
			liveStops.clear();
			host.querySelectorAll('.ripple__layer').forEach((n) => n.remove());
		}
	};
};
