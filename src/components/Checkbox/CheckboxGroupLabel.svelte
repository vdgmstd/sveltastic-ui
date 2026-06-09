<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CheckboxGroupLabelProps = WithElementRef<
		{
			/** Label content. */
			children?: Snippet;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { useCheckboxGroupContext } from './context';

	let {
		children,
		ref = $bindable(null),
		id: idProp,
		class: className,
		...rest
	}: CheckboxGroupLabelProps = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);
	const group = useCheckboxGroupContext();

	$effect(() => group?.registerLabel(id));
</script>

<span
	class={cn('checkbox-group__label', className)}
	{@attach attachRef<HTMLSpanElement>((node) => (ref = node))}
	{id}
	data-testid="checkbox-group-label"
	{...rest}
>
	{@render children?.()}
</span>

<style>
	.checkbox-group__label {
		font-size: var(--fs-md);
		font-weight: 600;
		color: rgb(var(--text) / 0.9);
	}
</style>
