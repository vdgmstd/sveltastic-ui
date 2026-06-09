<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';

	export type RadioGroupItemProps = WithElementRef<
		{
			/** The token this radio represents. Selected when the group `value` equals it. */
			value: string;
			/** Inert radio. */
			disabled?: boolean;
			/** Spinner overlay; blocks interaction. */
			loading?: boolean;
			/** Label placement relative to the disc. */
			labelPosition?: 'before' | 'after';
			/** Per-item palette accent. Falls back to the group `color`. */
			color?: Color;
			/** Accessible name when no visible `<RadioGroup.Label>` is rendered. */
			ariaLabel?: string;
			/** Composition slot — `<RadioGroup.Indicator>` + `<RadioGroup.Label>`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own label element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLLabelElement>, 'children' | 'color'>,
		HTMLLabelElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { reducedMotion } from '../../state/reducedMotion.svelte';
	import { setRadioItemContext, useRadioGroupContext } from './context';
	import { RadioGroupItemState } from './radioGroupState.svelte';

	let {
		ref = $bindable(null),
		value,
		disabled = false,
		loading = false,
		labelPosition = 'after',
		color,
		ariaLabel,
		children,
		child,
		id: idProp,
		class: className,
		style: userStyle,
		...rest
	}: RadioGroupItemProps = $props();

	const root = useRadioGroupContext();
	if (!root) throw new Error('<RadioGroup.Item> must be used within <RadioGroup.Root>');

	const uid = $props.id();
	let inputId = $derived(idProp ?? uid);

	const item = setRadioItemContext(
		new RadioGroupItemState(root, {
			getValue: () => value,
			getDisabled: () => disabled,
			getLoading: () => loading,
			getColor: () => color,
			getInputId: () => inputId,
			getAriaLabel: () => ariaLabel
		})
	);

	$effect(() => reducedMotion.subscribe());
	$effect(() => root.registerValue(value));
	$effect(() => item.syncActive());

	const refKey = createAttachmentKey();
	const labelAttrs = $derived({
		class: 'radio',
		for: inputId,
		'data-testid': 'radio-group-item',
		'data-state': item.isChecked ? ('checked' as const) : ('unchecked' as const),
		'data-value': value,
		'data-checked': boolAttr(item.isChecked),
		'data-disabled': boolAttr(item.isDisabled),
		'data-readonly': boolAttr(item.isReadonly),
		'data-loading': boolAttr(loading),
		'data-pressing': boolAttr(item.isPressing),
		'data-label-before': boolAttr(labelPosition === 'before'),
		'data-orientation': root.orientation,
		onpointerdown: item.press.onpointerdown
	});
	const merged = $derived(
		mergeProps(rest, labelAttrs, {
			class: className,
			[refKey]: attachRef<HTMLLabelElement>((n) => (ref = n))
		})
	);
	let cssVars = $derived(`--c:${item.triplet};--ap:${item.activeValue};${userStyle ?? ''}`);
</script>

{#if child}
	{@render child({ props: { ...merged, style: cssVars } })}
{:else}
	<label {...merged} style={cssVars}>
		{@render children?.()}
	</label>
{/if}
