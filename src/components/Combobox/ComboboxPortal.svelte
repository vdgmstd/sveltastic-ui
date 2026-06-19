<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { PortalTarget } from '../../actions/portal';

	export type ComboboxPortalProps = {
		/** Portal target for the dropdown panel. CSS selector or element; defaults to `document.body`. */
		to?: PortalTarget;
		/** Render the panel in place instead of portalling it. */
		disabled?: boolean;
		/** Keep the panel mounted while closed (presence via `data-state`). */
		forceMount?: boolean;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getComboboxCtx } from './context';

	let { to, disabled = false, forceMount = false, children }: ComboboxPortalProps = $props();
	const root = getComboboxCtx();

	$effect(() => {
		root.portal = { target: to, disabled, forceMount };
		return () => {
			root.portal = {};
		};
	});
</script>

{@render children?.()}
