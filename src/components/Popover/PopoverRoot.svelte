<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		PopoverPlacement,
		PopoverOpenAnim,
		PopoverRole,
		PopoverTriggerOn
	} from '../../primitives/Popover.svelte';

	export type PopoverRootProps = {
		/** Open state. Two-way bindable. */
		open?: boolean;
		/** How the trigger opens the panel. */
		triggerOn?: PopoverTriggerOn;
		/** Anchor side + alignment relative to the trigger. */
		placement?: PopoverPlacement;
		/** Gap in px between trigger and panel. */
		offset?: number;
		/** Match the panel width to the trigger. */
		matchWidth?: boolean;
		/** Stretch the trigger wrapper to its container width. */
		block?: boolean;
		/** Disable the trigger. */
		disabled?: boolean;
		/** Trap focus + mark aria-modal. Defaults from `popupRole` ('dialog' → modal). */
		modal?: boolean;
		/** ARIA role on the panel. */
		popupRole?: PopoverRole;
		/** Accessible name for the panel. */
		ariaLabel?: string;
		/** Close on Escape. */
		closeOnEsc?: boolean;
		/** Close on outside pointerdown. Defaults true for non-manual triggers. */
		closeOnClickOutside?: boolean;
		/** Close when an interactive descendant is clicked. Off by default (use Popover.Close). */
		closeOnSelect?: boolean;
		/** Panel open/close animation. */
		openAnim?: PopoverOpenAnim;
		/** Override the animation duration (ms). */
		openDuration?: number;
		/** Override the animation easing (svelte/easing). */
		openEasing?: (t: number) => number;
		/** Fires whenever `open` changes. */
		onOpenChange?: (open: boolean) => void;
		/** Fires after the close transition finishes (panel fully removed). */
		onOpenChangeComplete?: (open: boolean) => void;
		/** Class merged onto the trigger wrapper. */
		class?: string;
		/** Inline style merged onto the trigger wrapper. */
		style?: string;
		/** Place Popover.Trigger and Popover.Content (and Popover.Portal) here. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import PopoverEngine from '../../primitives/Popover.svelte';
	import { setPopoverCtx } from './context';
	import { PopoverRootState } from './popover.svelte';

	let {
		open = $bindable(false),
		triggerOn = 'click',
		placement = 'bottom-start',
		offset = 8,
		matchWidth = false,
		block = false,
		disabled = false,
		modal,
		popupRole = 'dialog',
		ariaLabel,
		closeOnEsc = true,
		closeOnClickOutside,
		closeOnSelect = false,
		openAnim = 'pop',
		openDuration,
		openEasing,
		onOpenChange,
		onOpenChangeComplete,
		class: className,
		style: userStyle,
		children
	}: PopoverRootProps = $props();

	const root = setPopoverCtx(
		new PopoverRootState({
			getOpen: () => open,
			setOpenProp: (v) => {
				open = v;
			},
			get disabled() {
				return disabled;
			},
			get onOpenChange() {
				return onOpenChange;
			},
			get onOpenChangeComplete() {
				return onOpenChangeComplete;
			}
		})
	);
</script>

{@render children?.()}

<PopoverEngine
	bind:open={() => root.open, (v) => root.setOpen(v)}
	{triggerOn}
	{placement}
	{offset}
	{matchWidth}
	{block}
	{disabled}
	{modal}
	{popupRole}
	{ariaLabel}
	{closeOnEsc}
	{closeOnClickOutside}
	{closeOnSelect}
	{openAnim}
	{openDuration}
	{openEasing}
	portalTarget={root.portal.target}
	portalDisabled={root.portal.disabled}
	forceMount={root.portal.forceMount}
	contentProps={root.contentProps}
	contentRef={root.setContentRef}
	contentChild={root.contentChild}
	class={className}
	style={userStyle}
	onopenchangecomplete={() => root.completeOpenChange(false)}
>
	{#snippet trigger(arg)}
		{#if root.triggerSnippet}{@render root.triggerSnippet(arg)}{/if}
	{/snippet}

	{#snippet children(close)}
		{#if root.contentSnippet}{@render root.contentSnippet(close)}{/if}
	{/snippet}
</PopoverEngine>
