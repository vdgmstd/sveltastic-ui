<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';

	export type CheckboxGroupProps = WithElementRef<
		{
			/** Membership array of checked tokens. Use `bind:value` for two-way control. */
			value?: string[];
			/** Disable every checkbox in the group. */
			disabled?: boolean;
			/** Block interaction without dimming. */
			readonly?: boolean;
			/** Mark the group required. */
			required?: boolean;
			/** Native `name` applied to each member input (for form submission). */
			name?: string;
			/** Palette accent cascaded to members. */
			color?: Color;
			/** Member checkboxes (place `<Checkbox value=…>` here). */
			children?: Snippet;
			/** Fires with the next membership array on change. */
			onValueChange?: (value: string[]) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { setCheckboxGroupContext } from './context';
	import { CheckboxGroupState } from './checkbox.svelte';

	let {
		value = $bindable([]),
		disabled = false,
		readonly = false,
		required = false,
		name,
		color,
		children,
		onValueChange,
		ref = $bindable(null),
		class: className,
		...rest
	}: CheckboxGroupProps = $props();

	const group = setCheckboxGroupContext(
		new CheckboxGroupState({
			getValue: () => value,
			setValueProp: (v) => (value = v),
			onValueChange: () => onValueChange,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getRequired: () => required,
			getName: () => name,
			getColor: () => color
		})
	);
</script>

<div
	class={cn('checkbox-group', className)}
	{@attach attachRef<HTMLDivElement>((node) => (ref = node))}
	{...group.wrapperAttrs}
	{...rest}
>
	{@render children?.()}
</div>

<style>
	.checkbox-group {
		display: inline-flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
