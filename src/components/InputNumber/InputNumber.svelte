<script lang="ts" module>
	import './inputNumber.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, WithElementRef } from '../../types';

	export type InputNumberRootProps = WithElementRef<
		{
			/** Current value (bindable). */
			value?: number;
			/** Minimum value (inclusive). */
			min?: number;
			/** Maximum value (inclusive). */
			max?: number;
			/** Increment step. Used by buttons, native ↑/↓ keys, and long-press repeat. */
			step?: number;
			/** Visual size — matches the kit's `Size` scale. */
			size?: Size;
			/** Border-radius shape. */
			shape?: Shape;
			/** Stretch to container width. */
			block?: boolean;
			/** Disabled. */
			disabled?: boolean;
			/** Read-only — buttons + field both inert; value cannot change. */
			readonly?: boolean;
			/** Field accent color — drives focus ripple and outline. Defaults to `primary`. */
			color?: Color;
			/** Color for the `+` (increment) button hover/press tint. Falls back to `color`. */
			incrementColor?: Color;
			/** Color for the `−` (decrement) button hover/press tint. Falls back to `color`. */
			decrementColor?: Color;
			/** Tween duration (ms) for the rolling digits. Same time regardless of step. Defaults to 500. */
			animationDuration?: number;
			/** Composition slot — `<InputNumber.Field>` + `<InputNumber.Decrement>` / `<InputNumber.Increment>`. */
			children?: Snippet;
			/** Fired on every committed value change (after clamping). */
			onValueChange?: (value: number) => void;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setInputNumberContext } from './context';
	import { InputNumberRootState } from './inputNumber.svelte';

	let {
		ref = $bindable(null),
		value = $bindable(0),
		min = -Infinity,
		max = Infinity,
		step = 1,
		size = 'medium',
		shape = 'default',
		block = false,
		disabled = false,
		readonly = false,
		color = 'primary',
		incrementColor,
		decrementColor,
		animationDuration = 500,
		children,
		onValueChange,
		child,
		class: className,
		style: userStyle,
		...rest
	}: InputNumberRootProps = $props();

	const fieldId = $props.id();

	const root = setInputNumberContext(
		new InputNumberRootState({
			fieldId,
			getValue: () => value,
			setValueProp: (next) => {
				value = next;
			},
			onValueChange: () => onValueChange,
			getMin: () => min,
			getMax: () => max,
			getStep: () => step,
			getSize: () => size,
			getShape: () => shape,
			getColor: () => color,
			getIncrementColor: () => incrementColor,
			getDecrementColor: () => decrementColor,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getAnimationDuration: () => animationDuration
		})
	);

	$effect(() => {
		root.syncDisplay();
	});

	$effect(() => () => root.clearHold());

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: `input-number input-number--size-${size} input-number--shape-${shape}`,
		style: `--c:${root.triplet};${userStyle ?? ''}`,
		'data-testid': 'input-number',
		'data-block': boolAttr(block),
		'data-disabled': boolAttr(disabled),
		'data-readonly': boolAttr(readonly),
		'data-state': dataState(root.isEditing ? 'editing' : undefined)
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{@render children?.()}
	</div>
{/if}
