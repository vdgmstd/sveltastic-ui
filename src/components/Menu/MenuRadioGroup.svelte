<script lang="ts" module>
	import '../../styles/radio.css';
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type MenuRadioGroupProps = WithElementRef<
		{
			/** Selected value. Two-way bindable. */
			value?: string;
			/** Fires when the selected value changes. */
			onValueChange?: (value: string) => void;
			/** Accessible name for the group. */
			ariaLabel?: string;
			/** `Menu.RadioItem` rows. */
			children?: Snippet;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import { setMenuRadioGroupCtx } from './context';

	let {
		ref = $bindable(null),
		value = $bindable(),
		onValueChange,
		ariaLabel,
		children
	}: MenuRadioGroupProps = $props();

	setMenuRadioGroupCtx({
		get value() { return value; },
		set: (next: string) => { value = next; onValueChange?.(next); }
	});
</script>

<div
	class="menu-radio-group"
	role="group"
	aria-label={ariaLabel}
	{@attach attachRef<HTMLDivElement>((n) => (ref = n))}
>
	{@render children?.()}
</div>

<style>
	/* Dissolve so grouped rows keep the popover body's 2px gap rhythm. */
	.menu-radio-group {
		display: contents;
	}
</style>
