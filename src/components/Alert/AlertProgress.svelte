<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertProgressProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			/** Fill amount, 0–100. */
			percent?: number;
			/** Accessible label for the progress bar. */
			ariaLabel?: string;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		}
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { reducedMotion } from '../../state/reducedMotion.svelte';
	import { getAlertCtx } from './context';

	let {
		percent = 0,
		ariaLabel = 'Progress',
		ref = $bindable(null),
		class: className,
		child,
		...rest
	}: AlertProgressProps = $props();
	const root = getAlertCtx();

	let value = $derived(Math.max(0, Math.min(100, percent)));

	$effect(() => untrack(() => root.registerProgress()));

	const fill = new Tween(untrack(() => value), { duration: 250, easing: cubicInOut });
	$effect(() => {
		fill.set(value, { duration: reducedMotion.current ? 0 : 250 });
	});

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('alert__progress', className),
			role: 'progressbar' as const,
			'aria-label': ariaLabel,
			'aria-valuenow': value,
			'aria-valuemin': 0,
			'aria-valuemax': 100,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		<div class="alert__progress__bar" style:--w={fill.current / 100}></div>
	</div>
{/if}
