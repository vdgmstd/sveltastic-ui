<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertTitleProps = WithElementRef<
		Omit<HTMLAttributes<HTMLElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		}
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { ref = $bindable(null), class: className, children, child, ...rest }: AlertTitleProps =
		$props();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('alert__title', className),
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		<span class="alert__title-text">{@render children?.()}</span>
	</div>
{/if}

<style>
	.alert__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-7);
		font-weight: 600;
		font-size: var(--fs-lg);
	}
	.alert__title-text {
		display: inline-flex;
		align-items: center;
	}
</style>
