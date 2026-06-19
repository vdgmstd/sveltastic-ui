<script lang="ts" module>
	import type { PressableProps } from '../../primitives/Pressable.svelte';

	/** Public props for `Toggle.Root` (bits-ui v2 Toggle) — the kit's button-core with a pressed (on/off) state. */
	export type ToggleProps = Omit<PressableProps, 'active' | 'onActiveChange'> & {
		/** Pressed (on) state. Two-way bindable. */
		pressed?: boolean;
		/** Fired when the pressed state changes. */
		onPressedChange?: (pressed: boolean) => void;
	};
</script>

<script lang="ts">
	import Pressable from '../../primitives/Pressable.svelte';

	let {
		pressed = $bindable(false),
		onPressedChange,
		variant = 'transparent',
		ref = $bindable(null),
		children,
		...rest
	}: ToggleProps = $props();

	function setPressed(value: boolean): void {
		pressed = value;
		onPressedChange?.(value);
	}
</script>

<Pressable
	{...(rest as PressableProps)}
	bind:ref
	{variant}
	active={pressed}
	onActiveChange={setPressed}
	data-state={pressed ? 'on' : 'off'}
	data-toggle-root=""
>
	{@render children?.()}
</Pressable>
