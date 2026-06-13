<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { PortalTarget } from '../../actions/portal';

	export type DialogPortalProps = {
		/** Portal target for the dialog. CSS selector or element; defaults to `document.body`. */
		to?: PortalTarget;
		/** Render the dialog in place instead of portalling it. */
		disabled?: boolean;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getDialogCtx } from './context';

	let { to, disabled = false, children }: DialogPortalProps = $props();
	const root = getDialogCtx();

	$effect(() => {
		root.portal = { active: true, target: to, disabled };
		return () => {
			root.portal = {};
		};
	});
</script>

{@render children?.()}
