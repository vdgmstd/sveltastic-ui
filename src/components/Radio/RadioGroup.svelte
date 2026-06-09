<script lang="ts" module>
	import '../../styles/radio.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type { RadioGroupOrientation } from './context';

	export type { RadioGroupOrientation } from './context';

	export type RadioGroupRootProps = WithElementRef<
		{
			/** Selected token. Bindable. */
			value?: string;
			/** Native `name` shared by the radio set; enables form submission. Auto-generated if omitted. */
			name?: string;
			/** Disable the entire group. */
			disabled?: boolean;
			/** Mark the radio set as required for form validation. */
			required?: boolean;
			/** Read-only — focus and arrows work but selection cannot change. */
			readonly?: boolean;
			/** Layout + arrow-key axis. */
			orientation?: RadioGroupOrientation;
			/** Wrap arrow navigation past the ends. */
			loop?: boolean;
			/** Palette accent for every disc (overridable per `<RadioGroup.Item>`). */
			color?: Color;
			/** Accessible label for the radiogroup. */
			ariaLabel?: string;
			/** Composition slot — `<RadioGroup.Item>` children, in any order. */
			children?: Snippet;
			/** Fired on selection change. */
			onValueChange?: (value: string) => void;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'dir'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setRadioGroupContext } from './context';
	import { RadioGroupRootState } from './radioGroupState.svelte';

	let {
		ref = $bindable(null),
		value = $bindable(),
		name,
		disabled = false,
		required = false,
		readonly = false,
		orientation = 'vertical',
		loop = false,
		color = 'primary',
		ariaLabel,
		children,
		onValueChange,
		child,
		class: className,
		...rest
	}: RadioGroupRootProps = $props();

	const baseId = $props.id();

	const root = setRadioGroupContext(
		new RadioGroupRootState({
			baseId,
			getValue: () => value,
			setValueProp: (next) => {
				value = next;
			},
			onValueChange: () => onValueChange,
			getName: () => name,
			getColor: () => color,
			getDisabled: () => disabled,
			getRequired: () => required,
			getReadonly: () => readonly,
			getOrientation: () => orientation,
			getLoop: () => loop
		})
	);

	$effect(() => {
		root.roving.orientation = orientation;
		root.roving.loop = loop;
	});

	$effect(() => {
		if (value !== undefined) root.roving.setCurrent(root.itemId(value));
	});

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: 'radio-group',
		role: 'radiogroup' as const,
		'aria-label': ariaLabel,
		'aria-required': required || undefined,
		'aria-disabled': disabled || undefined,
		'aria-readonly': readonly || undefined,
		'aria-orientation': orientation,
		'data-orientation': orientation,
		'data-disabled': boolAttr(disabled),
		'data-readonly': boolAttr(readonly),
		'data-testid': 'radio-group'
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
