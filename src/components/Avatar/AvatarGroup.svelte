<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type AvatarGroupProps = {
		/** Max number of visible avatars. The last visible child shows a `+N` counter. */
		max?: number;
		/** When `true`, avatars wrap and each renders with a background-coloured border instead of overlapping. */
		float?: boolean;
		/** Avatars to render. */
		children?: Snippet;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import { AVATAR_GROUP_KEY, type AvatarGroupContext, type AvatarRegistration } from './Avatar.svelte';
	import { cn } from '../../utils/cn';

	let {
		max,
		float = false,
		children,
		class: className,
		style: userStyle,
		...rest
	}: AvatarGroupProps = $props();

	const tokens: object[] = $state([]);

	const groupContext: AvatarGroupContext = {
		register() {
			const token = {};
			tokens.push(token);

			return {
				state: (): AvatarRegistration => ({
					index: tokens.indexOf(token),
					total: tokens.length,
					max,
					float
				}),
				unregister() {
					const at = tokens.indexOf(token);
					if (at !== -1) tokens.splice(at, 1);
				}
			};
		}
	};

	setContext(AVATAR_GROUP_KEY, groupContext);
</script>

<div
	class={cn('avatar-group', float && 'avatar-group--float', className)}
	style={userStyle}
	data-testid="avatar-group"
	{...rest}
>
	{@render children?.()}
</div>

<style>
	:where(.avatar-group) {
		--group-overlap: 18px;
		--group-peek: 10px;
		--group-icons-peek: 34px;

		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: var(--group-overlap);
	}
	:where(.avatar-group--float) {
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: flex-start;
		padding-left: 0;
		gap: 4px;
	}
	.avatar-group:not(.avatar-group--float) :global(.avatar) {
		margin-left: calc(var(--group-overlap) * -1);
	}
	.avatar-group:not(.avatar-group--float) :global(.avatar:not(.avatar--has-color) .avatar__body) {
		background: rgb(var(--background));
	}
	.avatar-group:not(.avatar-group--float) :global(.avatar__latest) {
		width: calc(100% - 6px);
		height: calc(100% - 6px);
		margin: 3px;
	}
	.avatar-group:not(.avatar-group--float) :global(.avatar:hover) {
		transform: translate(calc(var(--group-peek) * -1), 0);
	}
</style>
