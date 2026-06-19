<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type ComboboxGroupProps = WithElementRef<{ children?: Snippet }, HTMLDivElement>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import { setComboboxGroupCtx } from './context';

	let { ref = $bindable(null), children }: ComboboxGroupProps = $props();

	let headingId = $state<string | undefined>(undefined);

	setComboboxGroupCtx({
		get headingId() { return headingId; },
		registerHeading: (id: string | undefined) => { headingId = id; }
	});
</script>

<div
	role="group"
	data-combobox-group=""
	aria-labelledby={headingId || undefined}
	{@attach attachRef<HTMLDivElement>((n) => (ref = n))}
>
	{@render children?.()}
</div>
