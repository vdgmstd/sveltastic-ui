import type { Action } from 'svelte/action';
import { Tween } from 'svelte/motion';
import { cubicOut, quintOut } from 'svelte/easing';
import { rgbTriplet, cssColor } from '../utils/color';
import type { Color } from '../types';

/**
 * GPU-composited ripple. The kit ripple is a soft accent "bloom" — bright
 * glowing core, accent body, transparent halo at the rim — that inks in
 * fast and unfolds slowly on cubic-out easing, with partial peak opacity
 * so the button's label/icon stays legible through it.
 *
 * The ripple's `transform: scale()` and `opacity` are driven by `Tween`
 * instances from `svelte/motion`; nothing animates via CSS @keyframes or
 * setTimeout-driven class swaps. The action owns the Tweens, the effect
 * scope and the DOM nodes; everything is released on `destroy`.
 */

export type RippleOptions = {
	/** Accent colour for this ripple. */
	color?: Color;
	/** Skip ripple emission entirely. */
	disabled?: boolean;
	/** Host surface IS the accent colour (filled buttons). Lifts the disc body so the wave doesn't blend into the bg. Flat / border / line: leave `false`. */
	solidBg?: boolean;
	/** Soft semi-transparent variant — gradient uses `rgb(--c / 0.18)` instead of full saturation. Pair with surfaces that themselves use a translucent accent (Switch, fieldState inputs). Customize alpha per-host via `--ripple-soft-alpha`. */
	soft?: boolean;
	/** Override the ink-in / fade duration (ms). Default scales with host width: `>150px → 750ms`, otherwise `550ms`. Components that want a more dramatic, deliberate splash (Switch) override this. */
	duration?: number;
	/** Override the spawn origin (relative to host top-left). Function form is evaluated at spawn time. Use to anchor the ripple to a state-driven position instead of the click point (e.g. Switch — anchor at the knob's destination side). */
	origin?: { x: number; y: number } | ((host: HTMLElement) => { x: number; y: number });
	/** Override the layer's clip radius. Use when the host's `border-radius` changes mid-ripple (e.g. range-start cells) and the bloom must stay in the resting shape. */
	radius?: string;
	/** CSS selector — ripple only spawns when `mousedown.target.closest(trigger)` matches inside the host. Lets the ripple visual span the entire host while the click trigger is restricted to a sub-region (e.g. only the header of a Collapse). */
	trigger?: string;
	/** Mount the ripple layer here instead of the host. Click capture stays on the host; this only re-parents the visual layer so transforms / clipping on an inner element (e.g. a background slot) carry the bloom along. */
	mountTo?: HTMLElement;
	/** Colour the host text animates to during the bloom (and back on settle). Defaults to `rgb(var(--on-accent))` — the kit token for text on an accent fill (matches `.button--default`'s text colour). Use a palette name or any CSS colour to override; pass `'currentColor'` to disable the shift entirely. */
	textColor?: Color | 'currentColor';
};

const HOST_CLASS = 'ripple-host';
const ACTIVE_CLASS = 'is-ripple-active';
const SHEET_ID = 'sveltastic-ui-ripple-styles';
const STYLES = `
.${HOST_CLASS} { position: relative; isolation: isolate; }

:where(.${HOST_CLASS}) > :where(*:not(.vs-ripple__layer)) {
	position: relative;
	z-index: 2;
}

.vs-ripple__layer {
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
	z-index: 1;
	border-radius: inherit;
}

.vs-ripple__effect {
	position: absolute;
	width: var(--ripple-size);
	height: var(--ripple-size);
	border-radius: 50%;
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

[data-theme='dark'] .vs-ripple__effect {
	background: radial-gradient(circle,
		rgb(var(--sa-color, 25 91 255)) 0%,
		rgb(var(--sa-color, 25 91 255)) 78%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 24%) 92%,
		rgb(var(--sa-color, 25 91 255)) 100%);
}

.vs-ripple__effect--on-fill {
	background: radial-gradient(circle,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 6%) 0%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 14%) 35%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 24%) 70%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 42%) 92%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 14%) 100%);
}

[data-theme='dark'] .vs-ripple__effect--on-fill {
	background: radial-gradient(circle,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 18%) 0%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 26%) 35%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 38%) 70%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 56%) 92%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255)), white 26%) 100%);
}

.vs-ripple__effect--soft {
	background: radial-gradient(circle,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.18)) 0%,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.18)) 78%,
		color-mix(in oklab, rgb(var(--sa-color, 25 91 255) / 0.18), white 24%) 92%,
		rgb(var(--sa-color, 25 91 255) / var(--ripple-soft-alpha, 0.18)) 100%);
}

[data-theme='dark'] .vs-ripple__effect--soft {
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
	let restColor: string | null = null;
	let targetColor: string | null = null;
	const fillStop = $effect.root(() => {
		$effect(() => {
			const rp = fill.current;
			host.style.setProperty('--rp', String(rp));
			if (restColor && targetColor) {
				const mix = `color-mix(in oklab, ${restColor}, ${targetColor} ${rp * 100}%)`;
				host.style.setProperty('color', mix, 'important');
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

	function resolveTextTarget(): string | null {
		if (opts.textColor === 'currentColor') return null;
		if (opts.textColor) return cssColor(opts.textColor);
		return 'rgb(var(--on-accent))';
	}

	function activateRest(): void {
		if (restActive) return;
		const target = resolveTextTarget();
		if (target === null) return;
		restColor = getComputedStyle(host).color;
		targetColor = target;
		host.classList.add(ACTIVE_CLASS);
		restActive = true;
	}

	function deactivateRest(): void {
		if (!restActive) return;
		host.classList.remove(ACTIVE_CLASS);
		host.style.removeProperty('color');
		host.style.removeProperty('--rp');
		restColor = null;
		targetColor = null;
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
		layer.className = 'vs-ripple__layer';
		if (opts.radius) layer.style.borderRadius = opts.radius;
		const node = document.createElement('span');
		node.className = 'vs-ripple__effect';
		if (opts.color) node.style.setProperty('--sa-color', rgbTriplet(opts.color));
		if (opts.solidBg) node.classList.add('vs-ripple__effect--on-fill');
		if (opts.soft) node.classList.add('vs-ripple__effect--soft');
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
			host.querySelectorAll('.vs-ripple__layer').forEach((n) => n.remove());
		}
	};
};
