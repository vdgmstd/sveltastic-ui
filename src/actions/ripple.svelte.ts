import type { ActionReturn } from 'svelte/action';
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
	/** Only spawn when `pointerdown.target.closest(trigger)` matches inside the host. */
	trigger?: string;
	/** Mount the visual layer here instead of the host; click capture stays on the host. */
	mountTo?: HTMLElement;
	/** Host text colour during the bloom. Defaults to the host's `--on-c` ink; `'currentColor'` disables the shift. */
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

const RIPPLE_COVER = 2.5;
const CANCEL_FADE = 180;

function coverSize(width: number, height: number, x: number, y: number): number {
	return Math.ceil(
		Math.max(
			Math.hypot(x, y),
			Math.hypot(width - x, y),
			Math.hypot(x, height - y),
			Math.hypot(width - x, height - y)
		) * RIPPLE_COVER
	);
}

/** Live handle of a mounted `ripple` action. */
export interface RippleHandle extends ActionReturn<RippleOptions | undefined> {
	update(next: RippleOptions | undefined): void;
	destroy(): void;
	/** Ink without a pointer event (keyboard activation). Origin defaults to `options.origin`, else the host centre. */
	spawnAt(origin?: { x: number; y: number }): void;
}

export const ripple = (host: HTMLElement, initial?: RippleOptions): RippleHandle => {
	let opts: RippleOptions = initial ?? {};
	const ac = new AbortController();
	const { signal } = ac;
	const liveStops = new Set<() => void>();
	// Each live disc keeps its origin so a host resize (e.g. an expanding collapse panel) can recompute its cover.
	const liveEffects = new Set<{ node: HTMLElement; x: number; y: number }>();
	// Discs still blooming, keyed by the pointer that spawned them: a touch scroll starting on the host fires
	// pointercancel, and without dissolving them the surface inks for a tap that never happens.
	const inFlight = new Map<number, () => void>();
	let activeRipples = 0;
	let restActive = false;

	const ro = new ResizeObserver(() => {
		if (liveEffects.size === 0) return;
		const w = host.clientWidth;
		const h = host.clientHeight;
		for (const eff of liveEffects) {
			eff.node.style.setProperty('--ripple-size', `${coverSize(w, h, eff.x, eff.y)}px`);
		}
	});
	ro.observe(host);

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
			// `--on-c` is the ink derived from this host's own fill; `--on-accent` is the kit-wide default.
			triplet =
				cs.getPropertyValue('--on-c').trim() ||
				cs.getPropertyValue('--on-accent').trim() ||
				'255 255 255';
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

	function resolveOrigin(evt?: PointerEvent): { x: number; y: number } {
		if (opts.origin) return typeof opts.origin === 'function' ? opts.origin(host) : opts.origin;
		if (!evt) return { x: host.clientWidth / 2, y: host.clientHeight / 2 };
		const r = host.getBoundingClientRect();
		return { x: evt.clientX - r.left, y: evt.clientY - r.top };
	}

	function ink(x: number, y: number, pointerId?: number): void {
		const w = host.clientWidth;
		const h = host.clientHeight;
		const size = coverSize(w, h, x, y);
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
		const eff = { node, x, y };
		liveEffects.add(eff);

		let disposed = false;
		function cleanup(): void {
			if (disposed) return;
			disposed = true;
			signal.removeEventListener('abort', cleanup);
			stop();
			liveStops.delete(stop);
			liveEffects.delete(eff);
			layer.remove();
			if (activeRipples === 0) deactivateRest();
		}

		signal.addEventListener('abort', cleanup, { once: true });

		const fadeDuration = Math.round(inkDuration * 1.1);
		let released = false;

		/** Hand the disc from its bloom to its fade; a cancelled gesture passes the live scale and a short duration so the ink and the text shift dissolve at once. */
		function release(scaleTo: number, duration: number): void {
			if (released) return;
			released = true;
			// Identity check: a re-press reusing this pointerId has already claimed the slot for its own disc.
			if (pointerId !== undefined && inFlight.get(pointerId) === cancel) inFlight.delete(pointerId);
			activeRipples = Math.max(0, activeRipples - 1);
			if (activeRipples === 0) fill.set(0, { duration, easing: quintOut });
			if (signal.aborted) return;
			void Promise.all([
				scale.set(scaleTo, { duration, easing: quintOut }),
				opacity.set(0, { duration, easing: quintOut })
			]).then(cleanup);
		}

		const cancel = (): void => release(scale.current, CANCEL_FADE);

		activeRipples++;
		activateRest();
		fill.set(1, { duration: inkDuration, easing: cubicOut });
		if (pointerId !== undefined) inFlight.set(pointerId, cancel);

		// Svelte never settles an interrupted `set()`, so a cancelled disc never reaches this hand-off.
		void Promise.all([
			opacity.set(1, { duration: 180, easing: cubicOut }),
			scale.set(1, { duration: inkDuration, easing: cubicOut })
		]).then(() => release(1.55, fadeDuration));
	}

	function spawn(evt: PointerEvent): void {
		if (opts.disabled) return;
		// Same gate as pressBounce: secondary mouse buttons never press; touch/pen report button 0.
		if (evt.button !== 0 && evt.pointerType === 'mouse') return;
		if (opts.trigger) {
			const target = evt.target as Element | null;
			if (!target || !target.closest(opts.trigger)) return;
		}
		const o = resolveOrigin(evt);
		ink(o.x, o.y, evt.pointerId);
	}

	function handlePointerCancel(evt: PointerEvent): void {
		inFlight.get(evt.pointerId)?.();
	}

	function spawnAt(origin?: { x: number; y: number }): void {
		if (opts.disabled) return;
		const o = origin ?? resolveOrigin();
		ink(o.x, o.y);
	}

	host.addEventListener('pointerdown', spawn, { signal, passive: true });
	host.addEventListener('pointercancel', handlePointerCancel, { signal, passive: true });

	return {
		update(next) {
			opts = next ?? {};
		},
		spawnAt,
		destroy() {
			ac.abort();
			ro.disconnect();
			liveEffects.clear();
			inFlight.clear();
			deactivateRest();
			host.classList.remove(HOST_CLASS);
			for (const s of liveStops) s();
			liveStops.clear();
			host.querySelectorAll('.ripple__layer').forEach((n) => n.remove());
		}
	};
};
