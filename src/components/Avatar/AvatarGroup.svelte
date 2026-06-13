<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AvatarGroupProps = WithElementRef<
		{
			/** Max number of visible avatars. The last visible child shows a `+N` counter. */
			max?: number;
			/** When `true`, avatars wrap and each renders with a background-coloured border instead of overlapping. */
			float?: boolean;
			/** Avatars to render. */
			children?: Snippet;
		} & HTMLAttributes<HTMLDivElement>
	>;
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { AVATAR_GROUP_KEY, type AvatarGroupContext, type AvatarRegistration } from './group';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		max,
		float = false,
		children,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: AvatarGroupProps = $props();

	const nodes = new SvelteSet<HTMLElement>();

	function orderedNodes(): HTMLElement[] {
		return [...nodes]
			.filter((n) => n.isConnected)
			.sort((a, b) => {
				const rel = a.compareDocumentPosition(b);
				if (rel & Node.DOCUMENT_POSITION_DISCONNECTED) return 0;
				return rel & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
			});
	}

	const groupContext: AvatarGroupContext = {
		register(node: HTMLElement) {
			nodes.add(node);
			return {
				state: (): AvatarRegistration => {
					const ordered = orderedNodes();
					return {
						index: ordered.indexOf(node),
						total: ordered.length,
						max,
						float
					};
				},
				unregister() {
					nodes.delete(node);
				}
			};
		}
	};

	setContext(AVATAR_GROUP_KEY, groupContext);

	let rootProps = $derived(
		mergeProps(rest, {
			'data-testid': 'avatar-group',
			'data-avatar-group': '',
			'data-float': boolAttr(float),
			style: userStyle
		})
	);
</script>

<div
	{...rootProps}
	class={cn('avatar-group', className)}
	{@attach attachRef((n) => (ref = n))}
>
	{@render children?.()}
</div>

<style>
	:where(.avatar-group) {
		--group-overlap: 18px;
		--group-peek: 10px;

		display: flex;
		align-items: center;
		justify-content: center;
		padding-inline-start: var(--group-overlap);
	}
	:where(.avatar-group[data-float]) {
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: flex-start;
		padding-inline-start: 0;
		gap: var(--space-2);
	}
	.avatar-group:not([data-float]) :global(.avatar) {
		margin-inline-start: calc(var(--group-overlap) * -1);
	}
	.avatar-group:not([data-float]) :global(.avatar:not(.avatar--has-color) .avatar__body) {
		background: rgb(var(--background));
	}
	.avatar-group:not([data-float]) :global(.avatar__latest) {
		inset: calc(var(--space-3) / 2);
	}
	.avatar-group:not([data-float]) :global(.avatar:hover) {
		transform: translate(calc(var(--group-peek) * -1), 0);
	}
	:global([dir='rtl']) .avatar-group:not([data-float]) :global(.avatar:hover) {
		transform: translate(var(--group-peek), 0);
	}
</style>
