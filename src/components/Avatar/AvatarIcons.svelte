<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';
	import type { AvatarIconsPlacement } from './Avatar.svelte';

	export type AvatarIconsProps = WithElementRef<
		{
			/** `vertical` hugs the right edge, `horizontal` the bottom. */
			placement?: AvatarIconsPlacement;
			/** Action icons; each renders as a cut-out badge. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & HTMLAttributes<HTMLDivElement>
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getAvatarContext } from './context';

	let {
		placement = 'vertical',
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: AvatarIconsProps = $props();

	const root = getAvatarContext();
	const refKey = createAttachmentKey();

	$effect(() => {
		const p = placement;
		return untrack(() => root.registerIcons(p));
	});

	const iconsProps = $derived(
		mergeProps(rest, {
			class: cn('avatar__icons', className),
			'data-avatar-icons': '',
			'data-placement': placement,
			[refKey]: attachRef((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: iconsProps })}
{:else}
	<div {...iconsProps}>{@render children?.()}</div>
{/if}

<style>
	.avatar__icons {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-2);
		background: rgb(var(--b));
		color: rgb(var(--on-accent));
		border: 2px solid rgb(var(--background));
		border-radius: var(--rad-pill);
		font-size: var(--fs-xs);
		opacity: 0;
		pointer-events: none;
		z-index: 3;
		transition:
			transform var(--dur-slow) var(--avatar-elastic),
			opacity 200ms var(--avatar-ease);
		transition-delay: 0ms;
	}
	:global(.avatar--has-icons:hover) .avatar__icons { transition-delay: 160ms; }

	.avatar__icons[data-placement='vertical'] {
		top: 50%;
		right: 0;
		flex-direction: column;
		transform: translate(calc(75% + 2px), -50%);
	}
	.avatar__icons[data-placement='horizontal'] {
		left: 50%;
		bottom: 0;
		flex-direction: row;
		transform: translate(-50%, calc(50% + 2px));
	}
	:global(.avatar--has-icons:hover) .avatar__icons {
		opacity: 1;
		pointer-events: auto;
	}
	:global(.avatar--icons-vertical:hover) .avatar__icons[data-placement='vertical'] {
		transform: translate(60%, -50%);
	}
	:global(.avatar--icons-horizontal:hover) .avatar__icons[data-placement='horizontal'] {
		transform: translate(-50%, 50%);
	}

	.avatar__icons :global(svg),
	.avatar__icons :global(i) {
		display: block;
		cursor: pointer;
		color: inherit;
		transition: transform 280ms var(--avatar-elastic);
	}
	.avatar__icons :global(svg):hover,
	.avatar__icons :global(i):hover {
		transform: scale(1.2);
	}
</style>
