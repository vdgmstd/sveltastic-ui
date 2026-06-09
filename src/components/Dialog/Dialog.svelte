<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color } from '../../types';
	import type { DialogSize, DialogAlign, DialogRole } from './dialog.svelte';

	export type { DialogSize, DialogAlign, DialogRole };

	export type DialogRootProps = {
		/** Open state. Two-way bindable. */
		open?: boolean;
		/** Preset width. `'fullscreen'` stretches to the viewport. */
		size?: DialogSize;
		/** Vertical alignment. `'top'` pins the dialog 6vh from the top. */
		align?: DialogAlign;
		/** Accent palette — drives focus outline and selection tint. */
		color?: Color;
		/** Block Esc + backdrop-click close paths; they play a bounce instead. */
		persistent?: boolean;
		/** ARIA role for the surface. `'alertdialog'` for destructive confirmations. */
		role?: DialogRole;
		/** Accessible name when no `Dialog.Title` is present. */
		ariaLabel?: string;
		/** Fires whenever `open` changes (open or close). */
		onOpenChange?: (open: boolean) => void;
		/** Fires after the exit transition finishes (surface fully removed). */
		onOpenChangeComplete?: (open: boolean) => void;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { setDialogCtx } from './context';
	import { DialogRootState } from './dialog.svelte';

	let {
		open = $bindable(false),
		size = 'medium',
		align = 'center',
		color = 'primary',
		persistent = false,
		role = 'dialog',
		ariaLabel,
		onOpenChange,
		onOpenChangeComplete,
		children
	}: DialogRootProps = $props();

	const root = setDialogCtx(
		new DialogRootState({
			getOpen: () => open,
			setOpenProp: (v) => { open = v; },
			get size() { return size; },
			get align() { return align; },
			get color() { return color; },
			get persistent() { return persistent; },
			get role() { return role; },
			get ariaLabel() { return ariaLabel; },
			get onOpenChange() { return onOpenChange; },
			get onOpenChangeComplete() { return onOpenChangeComplete; }
		})
	);
</script>

{@render children?.()}
