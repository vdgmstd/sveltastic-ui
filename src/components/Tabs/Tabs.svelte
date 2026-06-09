<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Size, WithElementRef } from '../../types';
	import type {
		TabsVariant,
		TabsPanelVariant,
		TabsTransition,
		TabsOrientation,
		TabsActivationMode
	} from './context';

	export type {
		TabsVariant,
		TabsPanelVariant,
		TabsTransition,
		TabsOrientation,
		TabsActivationMode
	} from './context';

	export type TabsRootProps = WithElementRef<
		{
			/** Active tab value. Bindable. */
			value?: string;
			/** Palette accent. Drives the thumb fill and active-state color via `--c`. */
			color?: Color;
			/** Rail variant: `underline` bottom bar (default), or filled `default`/`flat`/`border`/`relief` thumb. */
			variant?: TabsVariant;
			/** Sizing scale — shared with Button / Segmented (`xl` | `large` | `medium` | `small` | `mini`). */
			size?: Size;
			/** Panel surface — `'plain'` blends in, `'card'` wraps the active panel in a Card-like surface. */
			panelVariant?: TabsPanelVariant;
			/** Cross-panel transition. Default `crossfade`. */
			transition?: TabsTransition;
			/** Transition duration in ms. */
			transitionDuration?: number;
			/** Layout + arrow-key axis. Default `horizontal`. */
			orientation?: TabsOrientation;
			/** `automatic` selects on arrow-focus (default); `manual` moves focus only, Enter/Space selects. */
			activationMode?: TabsActivationMode;
			/** Wrap arrow navigation past the ends. Default `false`. */
			loop?: boolean;
			/** Disable every tab at once. */
			disabled?: boolean;
			/** Emit a click ripple into the active thumb (filled variants). */
			ripple?: boolean;
			/** Composition slot — `<Tabs.List>` and `<Tabs.Content>` go here, in any layout. */
			children?: Snippet;
			/** Fired on selection change. */
			onValueChange?: (value: string) => void;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Class merged onto the root. */
			class?: string;
			/** Inline style merged onto the root. */
			style?: string;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setTabsContext } from './context';
	import { TabsRootState } from './tabsState.svelte';

	let {
		ref = $bindable(null),
		value = $bindable(),
		color = 'primary',
		variant = 'underline',
		size = 'medium',
		panelVariant = 'plain',
		transition = 'crossfade',
		transitionDuration = 240,
		orientation = 'horizontal',
		activationMode = 'automatic',
		loop = false,
		disabled = false,
		ripple = true,
		children,
		onValueChange,
		child,
		class: className,
		style: userStyle,
		...rest
	}: TabsRootProps = $props();

	const baseId = $props.id();
	let triplet = $derived(rgbTriplet(color));

	const root = setTabsContext(
		new TabsRootState({
			baseId,
			getValue: () => value,
			setValueProp: (next) => {
				value = next;
			},
			color: () => color,
			variant: () => variant,
			size: () => size,
			panelVariant: () => panelVariant,
			transition: () => transition,
			transitionDuration: () => transitionDuration,
			orientation: () => orientation,
			activationMode: () => activationMode,
			loop: () => loop,
			disabled: () => disabled,
			ripple: () => ripple,
			onValueChange: () => onValueChange
		})
	);

	$effect(() => {
		root.roving.orientation = orientation === 'vertical' ? 'vertical' : 'horizontal';
		root.roving.loop = loop;
	});

	$effect(() => {
		if (value !== undefined) root.roving.setCurrent(value);
	});

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: 'tabs-root',
		'data-orientation': orientation,
		'data-disabled': boolAttr(disabled),
		'data-testid': 'tabs'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: { ...merged, style: `--c:${triplet};${userStyle ?? ''}` } })}
{:else}
	<div {...merged} style:--c={triplet} style={userStyle}>
		{@render children?.()}
	</div>
{/if}

<style>
	:where(.tabs-root) {
		--c: var(--primary);
		display: contents;
	}
</style>
