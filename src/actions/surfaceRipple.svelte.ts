import type { Action } from 'svelte/action';
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

/**
 * Soft accent ripple tied to a host surface (input field, button…).
 *
 * Two modes:
 *  - `focus` — blooms on focusin from the most recent pointerdown point
 *    (or the host centre when keyboard-focused), and fades on focusout.
 *    A single layer is live at any time.
 *  - `autoripple` — continuously spawns ripples at randomised positions
 *    inside the host. Visual cue for background work (e.g. Button's
 *    upload-style loading state).
 *
 * Colour is read directly from the host's `--c` CSS variable (kit convention).
 * All animation is driven by `svelte/motion` Tweens; nothing relies on
 * CSS @keyframes or setTimeout-driven class swaps for the bloom itself.
 */

type Common = {
	/** Skip ripple emission entirely. */
	disabled?: boolean;
	/** Mount the ripple layer here instead of the host. Useful when an inner element carries the visual (transformed background slot). */
	mountTo?: HTMLElement;
};

export type FocusSurfaceRippleOptions = Common & {
	mode: 'focus';
};

export type AutoSurfaceRippleOptions = Common & {
	mode: 'autoripple';
};

export type SurfaceRippleOptions = FocusSurfaceRippleOptions | AutoSurfaceRippleOptions;

const HOST_CLASS = 'surface-ripple-host';
const LAYER_CLASS = 'surface-ripple-layer';
const EFFECT_CLASS = 'surface-ripple-effect';
const SHEET_ID = 'sveltastic-ui-surface-ripple-styles';

const STYLES = `
.${HOST_CLASS} { position: relative; isolation: isolate; }
.${LAYER_CLASS} {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
	border-radius: inherit;
	z-index: 1;
}
.${EFFECT_CLASS} {
	position: absolute;
	width: var(--sr-size);
	height: var(--sr-size);
	left: var(--sr-x);
	top: var(--sr-y);
	border-radius: var(--rad-circle);
	background: radial-gradient(circle,
		rgb(var(--c, 25 91 255) / 0.18) 0%,
		rgb(var(--c, 25 91 255) / 0.18) 78%,
		color-mix(in oklab, rgb(var(--c, 25 91 255) / 0.18), white 24%) 92%,
		rgb(var(--c, 25 91 255) / 0.18) 100%);
	will-change: transform, opacity;
	contain: layout paint style;
	backface-visibility: hidden;
	transform-origin: center;
}
[data-theme='dark'] .${EFFECT_CLASS} {
	background: radial-gradient(circle,
		rgb(var(--c, 25 91 255) / 0.24) 0%,
		rgb(var(--c, 25 91 255) / 0.24) 78%,
		color-mix(in oklab, rgb(var(--c, 25 91 255) / 0.24), white 30%) 92%,
		rgb(var(--c, 25 91 255) / 0.24) 100%);
}
`;

let stylesInstalled = false;

function installStyles(): void {
	if (stylesInstalled || typeof document === 'undefined') return;
	if (document.getElementById(SHEET_ID)) {
		stylesInstalled = true;
		return;
	}
	const sheet = document.createElement('style');
	sheet.id = SHEET_ID;
	sheet.textContent = STYLES;
	document.head.appendChild(sheet);
	stylesInstalled = true;
}

function coverSize(width: number, height: number, x: number, y: number, sizeMultiplier: number): number {
	return Math.ceil(
		Math.max(
			Math.hypot(x, y),
			Math.hypot(width - x, y),
			Math.hypot(x, height - y),
			Math.hypot(width - x, height - y)
		) * sizeMultiplier
	);
}

function makeEffect(host: HTMLElement, x: number, y: number, sizeMultiplier: number): HTMLSpanElement {
	const r = host.getBoundingClientRect();
	const size = coverSize(r.width, r.height, x, y, sizeMultiplier);
	const node = document.createElement('span');
	node.className = EFFECT_CLASS;
	node.style.setProperty('--sr-x', `${x}px`);
	node.style.setProperty('--sr-y', `${y}px`);
	node.style.setProperty('--sr-size', `${size}px`);
	return node;
}

const FOCUS_COVER = 2.2;

function focusController(host: HTMLElement, mountHost: HTMLElement, signal: AbortSignal) {
	let pendingPoint: { x: number; y: number } | null = null;
	let layer: HTMLSpanElement | null = null;
	let stopFx: (() => void) | null = null;
	let liveEffect: HTMLElement | null = null;
	let liveOrigin = { x: 0, y: 0 };

	// Keep the bloom covering the host after a user resize (textarea drag-resize).
	const ro = new ResizeObserver(() => {
		if (!liveEffect) return;
		const r = host.getBoundingClientRect();
		liveEffect.style.setProperty('--sr-size', `${coverSize(r.width, r.height, liveOrigin.x, liveOrigin.y, FOCUS_COVER)}px`);
	});
	ro.observe(host);

	function dispose(): void {
		stopFx?.();
		stopFx = null;
		liveEffect = null;
		if (layer && layer.parentNode === mountHost) mountHost.removeChild(layer);
		layer = null;
	}

	function spawn(): void {
		dispose();
		const r = host.getBoundingClientRect();
		const p = pendingPoint ?? { x: r.width / 2, y: r.height / 2 };
		pendingPoint = null;

		const wrap = document.createElement('span');
		wrap.className = LAYER_CLASS;
		wrap.setAttribute('aria-hidden', 'true');
		const eff = makeEffect(host, p.x, p.y, FOCUS_COVER);
		wrap.appendChild(eff);
		mountHost.prepend(wrap);
		layer = wrap;
		liveEffect = eff;
		liveOrigin = p;

		const scale = new Tween(0.05, { duration: 500, easing: cubicOut });
		const opacity = new Tween(0, { duration: 200, easing: cubicOut });

		stopFx = $effect.root(() => {
			$effect(() => {
				eff.style.transform = `translate(-50%, -50%) scale(${scale.current})`;
				eff.style.opacity = String(opacity.current);
			});
		});

		opacity.target = 1;
		scale.target = 1;
	}

	function fadeOut(): void {
		const node = layer;
		const fx = stopFx;
		if (!node || !fx) {
			dispose();
			return;
		}
		const eff = node.firstElementChild as HTMLElement | null;
		if (!eff) {
			dispose();
			return;
		}
		const opacity = new Tween(parseFloat(eff.style.opacity || '1'), { duration: 280, easing: cubicOut });
		const localStop = $effect.root(() => {
			$effect(() => {
				eff.style.opacity = String(opacity.current);
			});
		});

		layer = null;
		stopFx = null;
		liveEffect = null;

		opacity.set(0, { duration: 280, easing: cubicOut }).then(() => {
			fx();
			localStop();
			if (node.parentNode === mountHost) mountHost.removeChild(node);
		});
	}

	host.addEventListener('pointerdown', (e) => {
		const r = host.getBoundingClientRect();
		pendingPoint = { x: e.clientX - r.left, y: e.clientY - r.top };
	}, { signal });
	host.addEventListener('focusin', spawn, { signal });
	host.addEventListener('focusout', fadeOut, { signal });

	function destroy(): void {
		ro.disconnect();
		dispose();
	}

	return { dispose, fadeOut, destroy };
}

function autorippleController(host: HTMLElement, mountHost: HTMLElement) {
	const COLS = 4;
	const ROWS = 2;
	const CELLS = COLS * ROWS;
	const layer = document.createElement('span');
	layer.className = LAYER_CLASS;
	layer.setAttribute('aria-hidden', 'true');
	mountHost.prepend(layer);

	const liveStops = new Set<() => void>();
	let timer: number | undefined;
	let running = false;
	let lastCell = -1;

	function spawn(): void {
		if (!running) return;
		const r = host.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) {
			if (running) timer = window.setTimeout(spawn, 200);
			return;
		}
		let cell = Math.floor(Math.random() * CELLS);
		if (CELLS > 1 && cell === lastCell) cell = (cell + 1 + Math.floor(Math.random() * (CELLS - 1))) % CELLS;
		lastCell = cell;
		const col = cell % COLS;
		const row = Math.floor(cell / COLS);
		const x = (col + Math.random()) * (r.width / COLS);
		const y = (row + Math.random()) * (r.height / ROWS);
		const inkMs = 880 + Math.random() * 880;
		const bloomMs = 5200 + Math.random() * 3600;
		const fadeMs = 1440 + Math.random() * 1280;
		if (running) timer = window.setTimeout(spawn, inkMs);

		const node = makeEffect(host, x, y, 0.9 + Math.random() * 1.8);
		layer.appendChild(node);

		const scale = new Tween(0.05, { duration: bloomMs, easing: cubicOut });
		const opacity = new Tween(0, { duration: inkMs, easing: cubicOut });

		const stop = $effect.root(() => {
			$effect(() => {
				node.style.transform = `translate(-50%, -50%) scale(${scale.current})`;
				node.style.opacity = String(opacity.current);
			});
		});
		liveStops.add(stop);

		void (async () => {
			await Promise.all([
				opacity.set(1, { duration: inkMs, easing: cubicOut }),
				scale.set(1, { duration: bloomMs, easing: cubicOut })
			]);
			if (!running) {
				stop();
				liveStops.delete(stop);
				node.remove();
				return;
			}
			await opacity.set(0, { duration: fadeMs, easing: cubicOut });
			stop();
			liveStops.delete(stop);
			node.remove();
		})();
	}

	function start(): void {
		if (running) return;
		running = true;
		spawn();
	}

	function stop(): void {
		running = false;
		if (timer !== undefined) {
			window.clearTimeout(timer);
			timer = undefined;
		}
	}

	function dispose(): void {
		stop();
		for (const s of liveStops) s();
		liveStops.clear();
		layer.remove();
	}

	return { start, stop, dispose };
}

export const surfaceRipple: Action<HTMLElement, SurfaceRippleOptions> = (host, initial) => {
	let opts: SurfaceRippleOptions = initial;
	const ac = new AbortController();

	installStyles();
	host.classList.add(HOST_CLASS);

	const mountHost = opts.mountTo ?? host;

	let focusCtl: ReturnType<typeof focusController> | null = null;
	let autoCtl: ReturnType<typeof autorippleController> | null = null;

	if (opts.mode === 'focus') {
		focusCtl = focusController(host, mountHost, ac.signal);
	} else {
		autoCtl = autorippleController(host, mountHost);
		if (!opts.disabled) autoCtl.start();
	}

	return {
		update(next) {
			opts = next;
			if (opts.mode === 'focus') {
				if (opts.disabled) focusCtl?.dispose();
			} else {
				if (opts.disabled) autoCtl?.stop();
				else autoCtl?.start();
			}
		},
		destroy() {
			ac.abort();
			focusCtl?.destroy();
			autoCtl?.dispose();
			host.classList.remove(HOST_CLASS);
		}
	};
};
