<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { PortalTarget } from '../../actions/portal';

	export type PopoverPortalProps = {
		/** Portal target for the panel. CSS selector or element; defaults to `document.body`. */
		to?: PortalTarget;
		/** Render the panel in place instead of portalling it. */
		disabled?: boolean;
		/** Keep the panel mounted while closed (presence via `data-state`). */
		forceMount?: boolean;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getPopoverCtx } from './context';

	let { to, disabled = false, forceMount = false, children }: PopoverPortalProps = $props();
	const root = getPopoverCtx();

	$effect(() => {
		root.portal = { target: to, disabled, forceMount };
		return () => {
			root.portal = {};
		};
	});
</script>

{@render children?.()}
