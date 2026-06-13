<script lang="ts" module>
	import '../../styles/menuItem.css';
	import type { Snippet } from 'svelte';
	import type { Color } from '../../types';
	import type { InputState, InputLabelStyle, InputVariant } from '../../primitives/fieldShell.svelte';
	import type { SelectItems, SelectOpenAnim, SelectType } from './selectState.svelte';

	export type {
		SelectItem,
		SelectGroup,
		SelectItems,
		SelectOpenAnim,
		SelectType
	} from './selectState.svelte';

	type SelectRootBaseProps<V> = {
		/** Items to render. Mix flat items and grouped sections freely. */
		items?: SelectItems<V>;
		/** Open state. Two-way bindable. */
		open?: boolean;
		/** Inline text filter. */
		filter?: boolean;
		/** Wrap arrow navigation past the edges. */
		loop?: boolean;
		/** Disabled. */
		disabled?: boolean;
		/** Spinner indicator (visual only). */
		loading?: boolean;
		/** State color tint (matches Input). */
		fieldState?: InputState;
		/** Visual style. Mirrors Input. */
		variant?: InputVariant;
		/** Stretch to container width. */
		block?: boolean;
		/** Collapse multi-chips after the first to a "+N" pill. */
		collapseChips?: boolean;
		/** Dropdown panel open/close animation. */
		openAnim?: SelectOpenAnim;
		/** Label / placeholder behaviour. */
		labelStyle?: InputLabelStyle;
		/** Static label. */
		label?: string;
		/** Placeholder text. */
		placeholder?: string;
		/** Text shown in the default empty state (no rows / filtered to nothing). Override the whole tray with `Select.Empty`. */
		emptyText?: string;
		/** Palette color. */
		color?: Color;
		/** Accessible name for the trigger when no visible label is present. */
		ariaLabel?: string;
		/** Fires whenever `open` changes (open or close). */
		onOpenChange?: (open: boolean) => void;
		/** Fires after the close transition finishes (panel fully removed). */
		onOpenChangeComplete?: (open: boolean) => void;
		/** Class merged onto the root wrapper. */
		class?: string;
		/** Inline style merged onto the root wrapper. */
		style?: string;
		children?: Snippet;
	};

	/** Compound Select root, generic over the option value `V` and discriminated on `type`. */
	export type SelectRootProps<V = unknown> =
		| (SelectRootBaseProps<V> & {
				type?: 'single';
				/** Bound selection. */
				value?: V;
				onValueChange?: (value: V | undefined) => void;
				/** Re-picking the selected row clears it (single mode). */
				allowDeselect?: boolean;
		  })
		| (SelectRootBaseProps<V> & {
				type: 'multiple';
				/** Bound selection array. */
				value?: V[];
				onValueChange?: (value: V[]) => void;
		  });
</script>

<script lang="ts" generics="V">
	import { cn } from '../../utils/cn';
	import Popover from '../../primitives/Popover.svelte';
	import { setSelectCtx } from './context';
	import { SelectRootState } from './selectState.svelte';

	let {
		items = [],
		open = $bindable(false),
		value = $bindable(),
		type = 'single',
		filter = false,
		loop = true,
		disabled = false,
		loading = false,
		fieldState = 'default',
		variant = 'default',
		block = false,
		collapseChips = false,
		openAnim = 'pop',
		labelStyle = 'default',
		label,
		placeholder = '',
		emptyText = 'No data',
		color = 'primary',
		ariaLabel,
		allowDeselect = false,
		onValueChange,
		onOpenChange,
		onOpenChangeComplete,
		class: className,
		style: userStyle,
		children
	}: SelectRootProps<V> & { allowDeselect?: boolean } = $props();

	const uid = $props.id();
	const triggerId = `select-trigger-${uid}`;
	const contentId = `select-content-${uid}`;

	const root = setSelectCtx(
		new SelectRootState<V>(
			{
				getOpen: () => open,
				setOpenProp: (v) => { open = v; },
				getValue: () => value,
				setValueProp: (v) => { value = v as V | V[] | undefined; },
				get items() { return items; },
				get type() { return type as SelectType; },
				get filter() { return filter; },
				get loop() { return loop; },
				get allowDeselect() { return type !== 'multiple' && allowDeselect; },
				get placeholder() { return placeholder; },
				get emptyText() { return emptyText; },
				get disabled() { return disabled; },
				get loading() { return loading; },
				get variant() { return variant; },
				get fieldState() { return fieldState; },
				get block() { return block; },
				get collapseChips() { return collapseChips; },
				get openAnim() { return openAnim; },
				get labelStyle() { return labelStyle; },
				get label() { return label; },
				get color() { return color; },
				get ariaLabel() { return ariaLabel; },
				get onValueChange() { return onValueChange as (v: V | V[] | undefined) => void; },
				get onOpenChange() { return onOpenChange; },
				get onOpenChangeComplete() { return onOpenChangeComplete; }
			},
			triggerId,
			contentId
		)
	);

	$effect(() => () => root.destroy());
</script>

<div
	class={cn('select-wrap', block && 'select-wrap--block', className)}
	style:--c={root.triplet}
	style={userStyle}
	data-testid="select"
	data-state={root.open ? 'open' : 'closed'}
>
	{@render children?.()}

	<Popover
		bind:open={() => root.open, (v) => root.setOpen(v)}
		placement="bottom-start"
		openAnim={root.panelAnim}
		matchWidth
		popupRole="listbox"
		multiselectable={root.isMultiple}
		triggerRole="combobox"
		closeOnSelect={!root.isMultiple}
		autoFocus={false}
		{disabled}
		{block}
		{ariaLabel}
		portalTarget={root.portal.target}
		portalDisabled={root.portal.disabled}
		forceMount={root.portal.forceMount}
		onopenchangecomplete={() => root.completeOpenChange(false)}
	>
		{#snippet trigger({ props })}
			{#if root.triggerSnippet}{@render root.triggerSnippet(props)}{/if}
		{/snippet}

		{#snippet children(close)}
			{#if root.contentSnippet}{@render root.contentSnippet(close)}{/if}
		{/snippet}
	</Popover>
</div>

<style>
	:where(.select-wrap) {
		--c: var(--primary);
		display: inline-flex;
		flex-direction: column;
		gap: var(--space-2);
		position: relative;
		max-width: 100%;
	}
	:where(.select-wrap--block) { display: flex; width: 100%; }
</style>
