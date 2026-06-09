<script lang="ts" module>
	import type { Color } from '../types';

	export type TimeWheelItem = { key: number; label: string };

	export type TimeWheelProps = {
		/** Current value (one of `items[].key`). */
		value: number;
		/** All values to render top-to-bottom. */
		items: ReadonlyArray<TimeWheelItem>;
		/** Palette accent for the center indicator + selected glyph. */
		color?: Color;
		/** Disable interaction. */
		disabled?: boolean;
		/** Total wheel height in px. Defaults to 5 rows × `itemHeight`. */
		height?: number;
		/** Single row height in px. */
		itemHeight?: number;
		/** Optional aria label for the column (e.g. "Hours"). */
		ariaLabel?: string;
		/** Fires after scroll-snap settles or on item click. */
		onchange?: (value: number) => void;
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { rgbTriplet } from '../utils/color';
	import { boolAttr } from '../utils/attrs';
	import { reducedMotion } from '../state/reducedMotion.svelte';

	let {
		value,
		items,
		color = 'primary',
		disabled = false,
		height,
		itemHeight = 28,
		ariaLabel,
		onchange
	}: TimeWheelProps = $props();

	const COPIES = 3;
	const uid = $props.id();
	const activeId = `tw-${uid}-active`;

	let triplet = $derived(rgbTriplet(color));
	let resolvedHeight = $derived(height ?? itemHeight * 5);

	let virtualItems = $derived.by(() => {
		if (items.length === 0) return [] as TimeWheelItem[];
		const out: TimeWheelItem[] = [];
		for (let c = 0; c < COPIES; c += 1) for (const it of items) out.push(it);
		return out;
	});

	let oneCopyH = $derived(items.length * itemHeight);

	let scrollEl = $state<HTMLDivElement>();
	let scrollTop = $state(0);
	let settleTimer: number | undefined;
	let userScrolling = $state(false);
	let centered = false;
	let initRaf = 0;

	const programmaticScroll = new Tween(0, { duration: 320, easing: cubicOut });
	let driveProgrammatic = $state(false);

	const indicatorPulse = new Tween(0.12, { duration: 280, easing: cubicOut });

	$effect(() => reducedMotion.subscribe());

	function indexOf(v: number): number {
		return items.findIndex((it) => it.key === v);
	}

	function applyScrollTop(top: number): void {
		if (!scrollEl) return;
		scrollEl.scrollTop = top;
	}

	$effect(() => {
		if (!driveProgrammatic) return;
		applyScrollTop(programmaticScroll.current);
	});

	function animateTo(virtIdx: number): void {
		if (!scrollEl) return;
		const target = virtIdx * itemHeight;
		driveProgrammatic = true;
		programmaticScroll.set(scrollEl.scrollTop, { duration: 0 });
		const dur = reducedMotion.current ? 0 : 320;
		void programmaticScroll.set(target, { duration: dur, easing: cubicOut }).then(() => {
			driveProgrammatic = false;
		});
	}

	function initialTop(): number {
		const idx = indexOf(value);
		return (items.length + (idx < 0 ? 0 : idx)) * itemHeight;
	}

	$effect(() => {
		if (!scrollEl || userScrolling || driveProgrammatic) return;
		if (items.length === 0) return;
		const target = initialTop();
		if (Math.abs(scrollEl.scrollTop - target) <= 0.5) {
			centered = true;
			return;
		}
		scrollEl.scrollTop = target;
		scrollTop = target;
		// Firefox drops a scrollTop set while the popover is still hidden/transitioning — re-assert until it sticks.
		if (!centered && initRaf === 0) {
			let tries = 0;
			const reassert = (): void => {
				initRaf = 0;
				if (!scrollEl || userScrolling || driveProgrammatic || centered) return;
				const t = initialTop();
				if (Math.abs(scrollEl.scrollTop - t) <= 0.5) {
					centered = true;
					return;
				}
				scrollEl.scrollTop = t;
				scrollTop = t;
				if (++tries < 30) initRaf = requestAnimationFrame(reassert);
			};
			initRaf = requestAnimationFrame(reassert);
		}
	});

	function recenter(): boolean {
		if (!scrollEl || items.length === 0) return false;
		const top = scrollEl.scrollTop;
		if (top < oneCopyH) {
			scrollEl.scrollTop = top + oneCopyH;
			scrollTop = scrollEl.scrollTop;
			return true;
		}
		if (top >= 2 * oneCopyH) {
			scrollEl.scrollTop = top - oneCopyH;
			scrollTop = scrollEl.scrollTop;
			return true;
		}
		return false;
	}

	function pulseIndicator(): void {
		indicatorPulse.set(0.22, { duration: 0 });
		void indicatorPulse.set(0.12, { duration: 360, easing: cubicOut });
	}

	function onScroll(): void {
		if (!scrollEl || disabled) return;
		scrollTop = scrollEl.scrollTop;
		if (driveProgrammatic) return;
		if (dragging) return;
		if (recenter()) return;
		userScrolling = true;
		if (settleTimer !== undefined) window.clearTimeout(settleTimer);
		settleTimer = window.setTimeout(() => {
			settleTimer = undefined;
			userScrolling = false;
			if (!scrollEl || items.length === 0) return;
			const virtIdx = Math.round(scrollEl.scrollTop / itemHeight);
			const logical = ((virtIdx % items.length) + items.length) % items.length;
			const next = items[logical];
			if (next && next.key !== value) {
				onchange?.(next.key);
				pulseIndicator();
			}
			animateTo(virtIdx);
		}, 110);
	}

	function pickVirt(virtIdx: number): void {
		if (disabled || items.length === 0) return;
		const logical = ((virtIdx % items.length) + items.length) % items.length;
		const item = items[logical];
		if (!item) return;
		userScrolling = false;
		if (item.key !== value) {
			onchange?.(item.key);
			pulseIndicator();
		}
		animateTo(virtIdx);
	}

	function onKeydown(e: KeyboardEvent): void {
		if (disabled || !scrollEl || items.length === 0) return;
		const currentVirt = Math.round(scrollEl.scrollTop / itemHeight);
		let next = currentVirt;
		if (e.key === 'ArrowDown') next = currentVirt + 1;
		else if (e.key === 'ArrowUp') next = currentVirt - 1;
		else if (e.key === 'PageDown') next = currentVirt + 5;
		else if (e.key === 'PageUp') next = currentVirt - 5;
		else if (e.key === 'Home') next = items.length;
		else if (e.key === 'End') next = items.length + items.length - 1;
		else return;
		e.preventDefault();
		pickVirt(next);
	}

	function onWheel(): void {
		if (disabled || !scrollEl) return;
		userScrolling = true;
	}

	let dragging = $state(false);
	let dragStartY = 0;
	let dragStartScroll = 0;
	let dragMoved = false;
	let dragPendingScroll: number | null = null;
	let dragRaf = 0;
	let activePointerId: number | null = null;
	let dragAc: AbortController | null = null;

	function snapToCurrent(): void {
		if (!scrollEl || items.length === 0) return;
		const virtIdx = Math.round(scrollEl.scrollTop / itemHeight);
		const logical = ((virtIdx % items.length) + items.length) % items.length;
		const next = items[logical];
		if (next && next.key !== value) {
			onchange?.(next.key);
			pulseIndicator();
		}
		animateTo(virtIdx);
	}

	function settleAfterDrag(): void {
		if (settleTimer !== undefined) window.clearTimeout(settleTimer);
		settleTimer = window.setTimeout(() => {
			settleTimer = undefined;
			userScrolling = false;
			snapToCurrent();
		}, 80);
	}

	function endDrag(pointerId: number | null): void {
		if (!dragging) return;
		dragging = false;
		if (dragRaf !== 0) {
			cancelAnimationFrame(dragRaf);
			dragRaf = 0;
		}
		if (dragPendingScroll !== null && scrollEl) {
			scrollEl.scrollTop = dragPendingScroll;
			dragPendingScroll = null;
		}
		if (pointerId !== null) {
			try { scrollEl?.releasePointerCapture(pointerId); } catch {  }
		}
		dragAc?.abort();
		dragAc = null;
		activePointerId = null;
		if (dragMoved) {
			recenter();
			settleAfterDrag();
		} else {
			userScrolling = false;
		}
	}

	function onPointerDown(e: PointerEvent): void {
		if (disabled || !scrollEl) return;
		if (e.pointerType === 'touch') return;
		if (e.button !== 0) return;
		dragging = true;
		dragMoved = false;
		dragStartY = e.clientY;
		dragStartScroll = scrollEl.scrollTop;
		userScrolling = true;
		activePointerId = e.pointerId;
		try { scrollEl.setPointerCapture(e.pointerId); } catch {  }

		// Backstop: a release far outside the viewport may skip the element pointerup.
		dragAc?.abort();
		dragAc = new AbortController();
		const { signal } = dragAc;
		const finish = (ev: PointerEvent) => {
			if (ev.pointerId !== activePointerId) return;
			endDrag(ev.pointerId);
		};
		window.addEventListener('pointerup', finish, { signal, capture: true });
		window.addEventListener('pointercancel', finish, { signal, capture: true });
		window.addEventListener('blur', () => endDrag(activePointerId), { signal });
	}

	function flushDragScroll(): void {
		dragRaf = 0;
		if (!scrollEl || dragPendingScroll === null) return;
		scrollEl.scrollTop = dragPendingScroll;
		dragPendingScroll = null;
	}

	function onPointerMove(e: PointerEvent): void {
		if (!dragging || !scrollEl) return;
		const dy = e.clientY - dragStartY;
		if (!dragMoved && Math.abs(dy) > 3) dragMoved = true;
		if (dragMoved) {
			dragPendingScroll = dragStartScroll - dy;
			if (dragRaf === 0) dragRaf = requestAnimationFrame(flushDragScroll);
			e.preventDefault();
		}
	}

	function onPointerUp(e: PointerEvent): void {
		endDrag(e.pointerId);
	}

	function onLostCapture(e: PointerEvent): void {
		endDrag(e.pointerId);
	}

	function onItemClick(idx: number, e: MouseEvent): void {
		if (dragMoved) {
			e.preventDefault();
			dragMoved = false;
			return;
		}
		pickVirt(idx);
	}

	// Destroy releases timers/raf/AC and flushes a pending drag write only; it never emits onchange or starts a tween.
	$effect(() => () => {
		if (settleTimer !== undefined) {
			window.clearTimeout(settleTimer);
			settleTimer = undefined;
		}
		if (dragRaf !== 0) {
			cancelAnimationFrame(dragRaf);
			dragRaf = 0;
		}
		if (initRaf !== 0) {
			cancelAnimationFrame(initRaf);
			initRaf = 0;
		}
		if (dragPendingScroll !== null && scrollEl) {
			scrollEl.scrollTop = dragPendingScroll;
			dragPendingScroll = null;
		}
		dragAc?.abort();
		dragAc = null;
		activePointerId = null;
	});

	function itemStyle(idx: number): { opacity: number; scale: number } {
		const center = scrollTop / itemHeight;
		const dist = Math.abs(idx - center);
		const opacity = Math.max(0.18, 1 - dist * 0.32);
		const scale = Math.max(0.82, 1 - dist * 0.06);
		return { opacity, scale };
	}

	function isActive(virtIdx: number): boolean {
		if (items.length === 0) return false;
		const center = Math.round(scrollTop / itemHeight);
		return virtIdx === center;
	}
</script>

<div
	class="time-wheel"
	data-disabled={boolAttr(disabled)}
	data-dragging={boolAttr(dragging)}
	style:--c={triplet}
	style:--h="{resolvedHeight}px"
	style:--ih="{itemHeight}px"
	style:--ind-op={indicatorPulse.current}
	role="listbox"
	tabindex={disabled ? -1 : 0}
	aria-label={ariaLabel}
	aria-activedescendant={activeId}
	onkeydown={onKeydown}
	data-testid="time-wheel"
>
	<div class="time-wheel__indicator" aria-hidden="true"></div>
	<div
		class="time-wheel__scroll"
		bind:this={scrollEl}
		role="presentation"
		onscroll={onScroll}
		onwheel={onWheel}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onlostpointercapture={onLostCapture}
	>
		{#each virtualItems as item, idx (idx)}
			{@const s = itemStyle(idx)}
			<button
				type="button"
				id={isActive(idx) ? activeId : undefined}
				class="time-wheel__item"
				data-active={boolAttr(isActive(idx))}
				role="option"
				aria-selected={isActive(idx)}
				tabindex="-1"
				{disabled}
				style:opacity={s.opacity}
				style:transform={`scale(${s.scale})`}
				onclick={(e) => onItemClick(idx, e)}
			>
				{item.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.time-wheel {
		position: relative;
		display: inline-block;
		width: 56px;
		height: var(--h);
		border-radius: var(--rad-md);
		outline: none;
		font-variant-numeric: tabular-nums;
		touch-action: pan-y;
		-webkit-user-select: none;
		user-select: none;
	}
	.time-wheel:focus-visible {
		box-shadow: 0 0 0 2px rgb(var(--c) / 0.4);
	}
	.time-wheel[data-disabled] {
		opacity: 0.5;
		pointer-events: none;
	}
	.time-wheel[data-dragging] .time-wheel__scroll {
		scroll-snap-type: none;
		cursor: grabbing;
	}
	.time-wheel[data-dragging] .time-wheel__item { scroll-snap-align: none; }

	.time-wheel__indicator {
		position: absolute;
		top: 50%;
		left: 4px;
		right: 4px;
		height: var(--ih);
		transform: translateY(-50%);
		background: rgb(var(--c) / var(--ind-op, 0.12));
		border-radius: var(--rad-sm);
		pointer-events: none;
		transition: background 200ms var(--ease-soft);
	}

	.time-wheel__scroll {
		position: relative;
		height: 100%;
		padding: calc((var(--h) - var(--ih)) / 2) 0;
		box-sizing: border-box;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
		overscroll-behavior: contain;
		cursor: grab;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0,
			black calc((var(--h) - var(--ih)) / 2),
			black calc((var(--h) + var(--ih)) / 2),
			transparent var(--h)
		);
		mask-image: linear-gradient(
			to bottom,
			transparent 0,
			black calc((var(--h) - var(--ih)) / 2),
			black calc((var(--h) + var(--ih)) / 2),
			transparent var(--h)
		);
	}
	.time-wheel__scroll::-webkit-scrollbar {
		display: none;
	}

	.time-wheel__item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: var(--ih);
		padding: 0;
		border: 0;
		background: transparent;
		color: rgb(var(--text));
		font: inherit;
		font-size: var(--fs-md);
		cursor: grab;
		scroll-snap-align: center;
		scroll-snap-stop: always;
		transition: color 200ms var(--ease-soft);
	}
	.time-wheel__item:active { cursor: grabbing; }
	.time-wheel__item[data-active] {
		color: rgb(var(--c));
		font-weight: 600;
	}
</style>
