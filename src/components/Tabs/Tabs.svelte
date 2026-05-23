<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Size } from '../../types';
	import type { TabsVariant, TabsPanelVariant, TabsTransition } from './context';

	export type { TabsVariant, TabsPanelVariant, TabsTransition } from './context';

	export type TabsProps = {
		/** Active tab value. Bindable. */
		value?: string;
		/** Palette accent. Drives the thumb fill and active-state color via `--c`. */
		color?: Color;
		/**
		 * Rail variant. Mirrors `<Segmented>` for the four filled looks plus the classic `underline`:
		 * - `underline` — transparent track, animated bottom bar (default).
		 * - `default` — gray track, solid accent thumb.
		 * - `tonal` — accent-tinted track, soft accent thumb (replaces old `pill`).
		 * - `border` — outlined track and thumb.
		 * - `relief` — sunken track, raised accent thumb with depth.
		 */
		variant?: TabsVariant;
		/** Sizing scale — shared with Button / Segmented (`xl` | `large` | `medium` | `small` | `mini`). */
		size?: Size;
		/** Panel surface — `'plain'` blends in, `'card'` wraps the active panel in a Card-like surface. */
		panelVariant?: TabsPanelVariant;
		/** Cross-panel transition. Default `crossfade`. */
		transition?: TabsTransition;
		/** Transition duration in ms. */
		transitionDuration?: number;
		/** Disable every tab at once. */
		disabled?: boolean;
		/** Composition slot — `<TabList>` and `<TabPanel>` go here, in any layout. */
		children?: Snippet;
		/** Fired on selection change. */
		onchange?: (value: string) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import { createTabsContext, type TabsContext, type TabsTransitionFn } from './context';

	let {
		value = $bindable(),
		color = 'primary',
		variant = 'underline',
		size = 'medium',
		panelVariant = 'plain',
		transition = 'crossfade',
		transitionDuration = 240,
		disabled = false,
		children,
		onchange,
		class: className,
		style: userStyle
	}: TabsProps = $props();

	const baseId = nextId('tabs');
	let triplet = $derived(rgbTriplet(color));

	type Entry = { el: HTMLElement; getDisabled: () => boolean };
	const order: string[] = $state([]);
	const entries = new Map<string, Entry>();
	let thumbLayer = $state<HTMLElement | undefined>(undefined);

	function setActive(next: string): void {
		if (value === next) return;
		value = next;
		onchange?.(next);
	}

	function tabId(v: string): string { return `${baseId}-tab-${v}`; }
	function panelId(v: string): string { return `${baseId}-panel-${v}`; }

	function register(v: string, el: HTMLElement, getDisabled: () => boolean): void {
		entries.set(v, { el, getDisabled });
		if (!order.includes(v)) order.push(v);
		if (value === undefined && !getDisabled()) setActive(v);
	}

	function unregister(v: string): void {
		entries.delete(v);
		const i = order.indexOf(v);
		if (i >= 0) order.splice(i, 1);
	}

	function getEl(v: string): HTMLElement | undefined {
		return entries.get(v)?.el;
	}

	function focusEntry(v: string): void {
		entries.get(v)?.el.focus();
		setActive(v);
	}

	function focusNext(from: string, dir: 1 | -1): void {
		const ids = order.filter((v) => !entries.get(v)?.getDisabled());
		if (ids.length === 0) return;
		const i = ids.indexOf(from);
		const next = i === -1 ? (dir > 0 ? 0 : ids.length - 1) : (i + dir + ids.length) % ids.length;
		focusEntry(ids[next]);
	}

	function focusEdge(edge: 'first' | 'last'): void {
		const ids = order.filter((v) => !entries.get(v)?.getDisabled());
		if (ids.length === 0) return;
		focusEntry(edge === 'first' ? ids[0] : ids[ids.length - 1]);
	}

	const initialDuration = untrack(() => transitionDuration);
	const [crossSend, crossReceive] = crossfade({
		duration: initialDuration,
		easing: cubicOut,
		fallback: (node) => fade(node, { duration: initialDuration, easing: cubicOut })
	});

	const noopTransition: TabsTransitionFn = () => ({ duration: 0 });

	let send = $derived<TabsTransitionFn>(
		transition === 'crossfade'
			? (node, p) => crossSend(node, p)
			: transition === 'fade'
				? (node) => fade(node, { duration: transitionDuration, easing: cubicOut })
				: transition === 'slide'
					? (node) => slide(node, { duration: transitionDuration, easing: cubicOut, axis: 'y' })
					: noopTransition
	);
	let receive = $derived<TabsTransitionFn>(
		transition === 'crossfade'
			? (node, p) => crossReceive(node, p)
			: transition === 'fade'
				? (node) => fade(node, { duration: transitionDuration, easing: cubicOut })
				: transition === 'slide'
					? (node) => slide(node, { duration: transitionDuration, easing: cubicOut, axis: 'y' })
					: noopTransition
	);

	const ctx: TabsContext = {
		get value() { return value; },
		get color() { return color; },
		get variant() { return variant; },
		get size() { return size; },
		get panelVariant() { return panelVariant; },
		get transition() { return transition; },
		get disabled() { return disabled; },
		get order() { return order; },
		get send() { return send; },
		get receive() { return receive; },
		get thumbLayer() { return thumbLayer; },
		baseId,
		setActive,
		tabId,
		panelId,
		register,
		unregister,
		getEl,
		focusNext,
		focusEdge,
		setThumbLayer: (el) => { thumbLayer = el; }
	};
	createTabsContext(ctx);
</script>

<div
	class={cn('tabs-root', className)}
	style:--c={triplet}
	style={userStyle}
	data-testid="tabs"
>
	{@render children?.()}
</div>

<style>
	:where(.tabs-root) {
		--c: var(--primary);
		display: contents;
	}
</style>
