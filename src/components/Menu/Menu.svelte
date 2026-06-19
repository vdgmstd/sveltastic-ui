<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		MenuPlacement,
		MenuTriggerOn,
		MenuOpenAnim,
		MenuPopupRole
	} from './menu.svelte';

	export type { MenuPlacement, MenuTriggerOn, MenuOpenAnim, MenuPopupRole };

	export type MenuRootProps = {
		/** Open state. Two-way bindable. */
		open?: boolean;
		/** Popup placement relative to the trigger. */
		placement?: MenuPlacement;
		/** How the menu opens. `'manual'` means the consumer drives `open` directly. */
		triggerOn?: MenuTriggerOn;
		/** Px gap between trigger and popup. */
		offset?: number;
		/** Close when pointer lands outside. Defaults to `triggerOn !== 'manual'`. */
		closeOnClickOutside?: boolean;
		/** Close on Esc key. */
		closeOnEsc?: boolean;
		/** Close when a row is chosen. */
		closeOnSelect?: boolean;
		/** Disable interaction. */
		disabled?: boolean;
		/** Stretch the trigger anchor to its parent's width. */
		block?: boolean;
		/** Match the trigger's width on the popup. */
		matchWidth?: boolean;
		/** Open / close animation preset. */
		openAnim?: MenuOpenAnim;
		/** Override animation duration (ms). */
		openDuration?: number;
		/** Override JS easing function (from `svelte/easing` or custom). */
		openEasing?: (t: number) => number;
		/** Popup ARIA role. */
		popupRole?: MenuPopupRole;
		/** Focus the first row on keyboard-initiated open. */
		autoFocus?: boolean;
		/** Accessible name for the popup when it has no visible heading. */
		ariaLabel?: string;
		/** Fires whenever `open` changes (open or close). */
		onOpenChange?: (open: boolean) => void;
		/** Fires after the close transition finishes (popup fully removed). */
		onOpenChangeComplete?: (open: boolean) => void;
		/** Class merged onto the trigger anchor. */
		class?: string;
		/** Inline style merged onto the trigger anchor. */
		style?: string;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import '../../styles/menuItem.css';
	import Popover from '../../primitives/Popover.svelte';
	import { attachRef } from '../../utils/ref';
	import { setMenuCtx } from './context';
	import { MenuRootState } from './menu.svelte';

	let {
		open = $bindable(false),
		placement = 'bottom-start',
		triggerOn = 'click',
		offset = 4,
		closeOnClickOutside,
		closeOnEsc = true,
		closeOnSelect = true,
		disabled = false,
		block = false,
		matchWidth = false,
		openAnim = 'pop',
		openDuration,
		openEasing,
		popupRole = 'menu',
		autoFocus = true,
		ariaLabel,
		onOpenChange,
		onOpenChangeComplete,
		class: className,
		style: userStyle,
		children
	}: MenuRootProps = $props();

	const uid = $props.id();
	const root = setMenuCtx(
		new MenuRootState(
			{
				getOpen: () => open,
				setOpenProp: (v) => { open = v; },
				get closeOnSelect() { return closeOnSelect; },
				get disabled() { return disabled; },
				get onOpenChange() { return onOpenChange; },
				get onOpenChangeComplete() { return onOpenChangeComplete; }
			},
			uid
		)
	);

	let listEl = $state<HTMLDivElement | null>(null);

	$effect(() => () => root.destroy());

	function handleListKeydown(event: KeyboardEvent): void {
		const handled = root.handleKeydown(event, listEl);
		if (handled || root.ownsNavKey(event.key)) event.stopPropagation();
	}
</script>

{@render children?.()}

<Popover
	bind:open={() => root.open, (v) => root.setOpen(v)}
	{placement}
	{triggerOn}
	{offset}
	{closeOnClickOutside}
	{closeOnEsc}
	{closeOnSelect}
	{disabled}
	{block}
	{matchWidth}
	{openAnim}
	{openDuration}
	{openEasing}
	{popupRole}
	{autoFocus}
	{ariaLabel}
	portalTarget={root.portal.target}
	portalDisabled={root.portal.disabled}
	forceMount={root.portal.forceMount}
	contentProps={root.contentProps}
	contentRef={root.setContentRef}
	contentChild={root.contentChild}
	class={className}
	style={userStyle}
	header={root.headerSnippet ? headerBody : undefined}
	footer={root.footerSnippet ? footerBody : undefined}
	onopenchangecomplete={() => root.completeOpenChange(false)}
>
	{#snippet trigger(arg)}
		{#if root.triggerSnippet}{@render root.triggerSnippet(arg)}{/if}
	{/snippet}

	{#snippet children(close)}
		<div
			{@attach attachRef((node) => (listEl = node))}
			class="menu__list"
			onkeydown={handleListKeydown}
			role="none"
		>
			{#if root.contentSnippet}{@render root.contentSnippet(close)}{/if}
		</div>
	{/snippet}
</Popover>

{#snippet headerBody(close: () => void)}
	{#if root.headerSnippet}{@render root.headerSnippet(close)}{/if}
{/snippet}

{#snippet footerBody(close: () => void)}
	{#if root.footerSnippet}{@render root.footerSnippet(close)}{/if}
{/snippet}

<style>
	/* Structural only — dissolves so rows stay direct flex children of the popover body. */
	.menu__list {
		display: contents;
	}
</style>
