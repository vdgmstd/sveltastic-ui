<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SelectGroupProps = WithElementRef<
		{ children?: Snippet },
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import { setSelectGroupCtx } from './context';

	let { ref = $bindable(null), children }: SelectGroupProps = $props();

	let headingId = $state<string | undefined>(undefined);

	setSelectGroupCtx({
		get headingId() { return headingId; },
		registerHeading: (id: string | undefined) => { headingId = id; }
	});
</script>

<div
	role="group"
	aria-labelledby={headingId || undefined}
	{@attach attachRef<HTMLDivElement>((n) => (ref = n))}
>
	{@render children?.()}
</div>
