<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { PortalTarget } from '../../actions/portal';

	export type TooltipPortalProps = {
		/** Portal target for the bubble. CSS selector or element; defaults to `document.body`. */
		to?: PortalTarget;
		/** Render the bubble in place instead of portalling it. */
		disabled?: boolean;
		/** Keep the bubble mounted while closed (presence via `data-state`). */
		forceMount?: boolean;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getTooltipCtx } from './context';

	let { to, disabled = false, forceMount = false, children }: TooltipPortalProps = $props();
	const root = getTooltipCtx();

	$effect(() => {
		root.portal = { target: to, disabled, forceMount };
		return () => {
			root.portal = {};
		};
	});
</script>

{@render children?.()}
