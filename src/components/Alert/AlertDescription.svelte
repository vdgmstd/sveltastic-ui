<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertDescriptionProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		}
	>;
</script>

<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getAlertCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: AlertDescriptionProps =
		$props();
	const root = getAlertCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			id: root.contentId,
			class: cn('alert__content', className),
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if !root.isCollapsed}
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<div {...merged} transition:slide={{ duration: root.motionDuration, easing: cubicInOut }}>
			<div class="alert__content__text">{@render children?.()}</div>
		</div>
	{/if}
{/if}

<style>
	.alert__content { overflow: hidden; }
	.alert__content__text {
		padding: var(--space-8) var(--space-7);
	}
</style>
