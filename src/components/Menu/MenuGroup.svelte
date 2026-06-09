<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type MenuGroupProps = WithElementRef<
		{
			/** Accessible name when no `Menu.GroupHeading` is present. */
			ariaLabel?: string;
			children?: Snippet;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import { setMenuGroupCtx } from './context';

	let { ref = $bindable(null), ariaLabel, children }: MenuGroupProps = $props();

	let headingId = $state<string | undefined>(undefined);

	setMenuGroupCtx({
		get headingId() { return headingId; },
		registerHeading: (id: string) => { headingId = id; }
	});
</script>

<div
	class="menu-group"
	role="group"
	aria-label={ariaLabel}
	aria-labelledby={headingId || undefined}
	{@attach attachRef<HTMLDivElement>((n) => (ref = n))}
>
	{@render children?.()}
</div>

<style>
	/* Dissolve so grouped rows keep the popover body's 2px gap rhythm. */
	.menu-group {
		display: contents;
	}
</style>
