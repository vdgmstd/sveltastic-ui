<script lang="ts" module>
	import type { PressableProps } from '../../primitives/Pressable.svelte';

	/** Public props for `Button.Root` — the styled pressable; renders a `<button>`, or an `<a>` when `href` is set. */
	export type ButtonRootProps = PressableProps;
</script>

<script lang="ts">
	import Pressable from '../../primitives/Pressable.svelte';

	let { ref = $bindable(null), children, ...rest }: ButtonRootProps = $props();
</script>

<Pressable bind:ref {...(rest as PressableProps)}>
	{@render children?.()}
</Pressable>
