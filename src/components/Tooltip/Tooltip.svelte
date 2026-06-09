<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color } from '../../types';
	import type { TooltipPlacement, TooltipTrigger } from './context';

	export type { TooltipPlacement, TooltipTrigger };

	export type TooltipRootProps = {
		/** Side of the trigger. */
		placement?: TooltipPlacement;
		/** Show / hide. Two-way bindable. */
		open?: boolean;
		/** Activation strategy. */
		trigger?: TooltipTrigger;
		/** Keep the bubble open while the pointer is over it. */
		interactive?: boolean;
		/** Show-delay in ms (hover/focus only). */
		delay?: number;
		/** Palette color — drives the bubble accent. */
		color?: Color;
		/** Fires when `open` changes. */
		onOpenChange?: (open: boolean) => void;
		/** Fires after the exit fade finishes (bubble fully removed). */
		onOpenChangeComplete?: (open: boolean) => void;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { setTooltipCtx } from './context';
	import { TooltipRootState } from './tooltipState.svelte';

	let {
		placement = 'top',
		open = $bindable(false),
		trigger = 'hover',
		interactive = false,
		delay = 0,
		color = 'dark',
		onOpenChange,
		onOpenChangeComplete,
		children
	}: TooltipRootProps = $props();

	const root = setTooltipCtx(
		new TooltipRootState({
			getOpen: () => open,
			setOpenProp: (v) => { open = v; },
			get placement() { return placement; },
			get trigger() { return trigger; },
			get delay() { return delay; },
			get interactive() { return interactive; },
			get color() { return color; },
			get onOpenChange() { return onOpenChange; },
			get onOpenChangeComplete() { return onOpenChangeComplete; }
		})
	);

	$effect(() => () => root.clearTimer());
</script>

{@render children?.()}
