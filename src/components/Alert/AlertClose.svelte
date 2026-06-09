<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertCloseProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			/** Accessible label when no visible children are supplied. */
			ariaLabel?: string;
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { XIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getAlertCtx } from './context';

	let {
		ariaLabel = 'Close',
		ref = $bindable(null),
		class: className,
		children,
		child,
		...rest
	}: AlertCloseProps = $props();
	const root = getAlertCtx();

	$effect(() => untrack(() => root.registerDismiss()));

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: cn('alert__close', className),
			'aria-label': ariaLabel,
			onclick: () => root.setOpen(false),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		{#if children}{@render children()}{:else}<XIcon size={18} weight="bold" />{/if}
	</button>
{/if}
