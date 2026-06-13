<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type { AvatarBadgePosition } from './Avatar.svelte';

	export type AvatarBadgeProps = WithElementRef<
		{
			/** Corner placement. Defaults to `bottom-right`. */
			position?: AvatarBadgePosition;
			/** Badge background color. Defaults to `--primary`. */
			color?: Color;
			/** Bouncing three-dot "typing" indicator instead of a dot/content. */
			writing?: boolean;
			/** Rich badge content. A filled pill when present. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'color'>
	>;
</script>

<script lang="ts">
	import { scale } from 'svelte/transition';
	import { backOut, backIn } from 'svelte/easing';
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	const badgeIn = { duration: 320, start: 0, easing: backOut };
	const badgeOut = { duration: 200, start: 0, easing: backIn };
	const refKey = createAttachmentKey();

	let {
		position = 'bottom-right',
		color,
		writing = false,
		children,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: AvatarBadgeProps = $props();

	let badgeTriplet = $derived(color !== undefined && color !== '' ? rgbTriplet(color) : undefined);
	let isFilled = $derived(!!children || writing);
	let style = $derived(
		[badgeTriplet !== undefined ? `--b:${badgeTriplet}` : undefined, userStyle]
			.filter(Boolean)
			.join(';')
	);

	const badgeProps = $derived(
		mergeProps(rest, {
			class: cn(
				'avatar__badge',
				`avatar__badge--${position}`,
				isFilled && 'avatar__badge--filled',
				writing && 'avatar__badge--writing',
				className
			),
			'data-avatar-badge': '',
			'data-position': position,
			'data-filled': boolAttr(isFilled),
			'data-writing': boolAttr(writing),
			style: style || undefined,
			[refKey]: attachRef((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: badgeProps })}
{:else}
	<div {...badgeProps} in:scale|global={badgeIn} out:scale|global={badgeOut}>
		{#if writing}
			<div class="avatar__points" aria-hidden="true">
				<span class="avatar__points__point"></span>
				<span class="avatar__points__point"></span>
				<span class="avatar__points__point"></span>
			</div>
		{:else}
			{@render children?.()}
		{/if}
	</div>
{/if}

<style>
	.avatar__badge {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 13px;
		height: 13px;
		background: rgb(var(--b));
		border: 2px solid rgb(var(--background));
		border-radius: var(--rad-circle);
		color: rgb(var(--on-accent));
		font-size: var(--fs-xs);
		font-weight: 600;
		line-height: var(--line-height);
		z-index: 200;
		box-sizing: border-box;
		transform-origin: center;
		transition: transform var(--dur-slow) var(--avatar-elastic) 80ms;
	}
	:global(.avatar:hover) .avatar__badge { transition-delay: 80ms; }
	.avatar__badge--top-right { top: -4px; right: -4px; }
	.avatar__badge--top-left { top: -4px; left: -4px; }
	.avatar__badge--bottom-left { bottom: -4px; left: -4px; }
	.avatar__badge--bottom-right { bottom: -4px; right: -4px; }

	.avatar__badge--filled {
		width: auto;
		height: auto;
		min-width: 18px;
		min-height: 18px;
		padding: 0 var(--space-3);
		border-radius: var(--rad-sm);
	}

	:global(.avatar[data-shape='circle']) .avatar__badge--top-right { top: -2px; right: -2px; }
	:global(.avatar[data-shape='circle']) .avatar__badge--top-left { top: -2px; left: -2px; }
	:global(.avatar[data-shape='circle']) .avatar__badge--bottom-left { bottom: -2px; left: -2px; }
	:global(.avatar[data-shape='circle']) .avatar__badge--bottom-right { bottom: -2px; right: -2px; }

	.avatar__points {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.avatar__points__point {
		display: inline-block;
		width: 5px;
		height: 5px;
		margin: 0 var(--space-1);
		border-radius: var(--rad-circle);
		background: rgb(var(--on-accent));
		animation: avatar-point 1200ms ease infinite;
	}
	.avatar__points__point:nth-child(2) { animation-delay: 400ms; }
	.avatar__points__point:nth-child(3) { animation-delay: 800ms; }

	@keyframes avatar-point {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.5); }
	}
</style>
