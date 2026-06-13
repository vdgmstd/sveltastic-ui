<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, WithElementRef } from '../../types';
	import type { AvatarLoadingStatus } from './avatarState.svelte';

	export type AvatarBadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
	export type AvatarIconsPlacement = 'vertical' | 'horizontal';

	export type AvatarRootProps = WithElementRef<
		{
			/** Palette name or hex / `rgb(...)` / `r,g,b`. When unset, the neutral gray-2 token is used. */
			color?: Color;
			/** Show `cursor: pointer` on hover. */
			pointer?: boolean;
			/** `default` squircle, `circle` perfect round, `square` for kit-radius corners. */
			shape?: Shape;
			/** Colored "story" ring around the avatar. */
			history?: boolean;
			/** When `history` is set, use the Instagram-style three-stop gradient ring. */
			historyGradient?: boolean;
			/** Full-cover overlay with a two-ring spinner. Distinct from `loadingStatus` (the image-probe state). */
			loading?: boolean;
			/** Image load lifecycle (`Avatar.Image` drives it). Two-way bindable. */
			loadingStatus?: AvatarLoadingStatus;
			/** Fires whenever the image load status changes. */
			onLoadingStatusChange?: (status: AvatarLoadingStatus) => void;
			/** Delay in ms before a successful image load flips status to `loaded`. */
			delayMs?: number;
			/** Accessible name for an image/icon-only avatar that has no visible text. */
			ariaLabel?: string;
			/** Word appended to the `+N` overflow counter's accessible name. Defaults to `more`. */
			moreLabel?: string;
			/** Primary content — compose `Avatar.Image` / `Avatar.Fallback` / `Avatar.Badge` / `Avatar.Icons`. */
			children?: Snippet;
			/** Render-delegation: receive the merged root props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Width and height in px. Number or numeric string. */
			size?: number | string;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'color'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import Spinner from '../../primitives/Spinner.svelte';
	import { AVATAR_GROUP_KEY, type AvatarGroupContext } from './group';
	import { getContext } from 'svelte';
	import { AvatarRootState } from './avatarState.svelte';
	import { setAvatarContext } from './context';

	let {
		color,
		pointer = false,
		shape = 'default',
		history = false,
		historyGradient = false,
		loading = false,
		loadingStatus = $bindable('loading'),
		onLoadingStatusChange,
		delayMs = 0,
		ariaLabel,
		moreLabel = 'more',
		children,
		child,
		size,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: AvatarRootProps = $props();

	const refKey = createAttachmentKey();

	const group = getContext<AvatarGroupContext | undefined>(AVATAR_GROUP_KEY);

	const root = setAvatarContext(
		new AvatarRootState({
			getStatus: () => loadingStatus,
			setStatusProp: (s) => (loadingStatus = s),
			getDelayMs: () => delayMs,
			getOnLoadingStatusChange: () => onLoadingStatusChange,
			getRef: () => ref,
			group
		})
	);

	$effect(() => root.registerGroup());

	let groupState = $derived(root.groupState);
	let index = $derived(groupState?.index ?? -1);
	let total = $derived(groupState?.total ?? 0);
	let max = $derived(groupState?.max);
	let groupFloat = $derived(groupState?.float ?? false);
	let isHidden = $derived(max !== undefined && index >= 0 && index > max - 1);
	let isLatest = $derived(max !== undefined && index === max - 1 && total > max);
	let hiddenCount = $derived(isLatest ? total - (max ?? 0) : 0);

	let hasColor = $derived(color !== undefined && color !== '');
	let colorTriplet = $derived(hasColor ? rgbTriplet(color) : undefined);

	let sizePx = $derived(size === undefined || size === '' ? undefined : `${size}px`);

	let showIcons = $derived(root.hasIcons);
	let hasVerticalIcons = $derived(root.hasVerticalIcons);
	let hasHorizontalIcons = $derived(root.hasHorizontalIcons);

	let cssVars = $derived(
		[
			colorTriplet !== undefined ? `--c:${colorTriplet}` : undefined,
			sizePx !== undefined ? `--avatar-size:${sizePx}` : undefined,
			userStyle
		]
			.filter(Boolean)
			.join(';')
	);

	// Hoisted: minting attachRef inside the $derived re-teardowns it each recompute → ref oscillates → registerGroup loop.
	const refAttach = attachRef((n) => (ref = n));
	const rootProps = $derived(
		mergeProps(rest, {
			'data-testid': 'avatar',
			'data-avatar-root': '',
			'data-status': dataState(loadingStatus),
			'data-shape': dataState(shape),
			'data-loading': boolAttr(loading),
			'data-hidden': boolAttr(isHidden),
			'data-in-group': boolAttr(root.inGroup),
			'data-group-float': boolAttr(groupFloat),
			'data-has-icons': boolAttr(showIcons),
			class: cn(
				'avatar',
				hasColor && 'avatar--has-color',
				history && 'avatar--history',
				history && historyGradient && 'avatar--history-gradient',
				showIcons && 'avatar--has-icons',
				hasVerticalIcons && 'avatar--icons-vertical',
				hasHorizontalIcons && 'avatar--icons-horizontal',
				pointer && 'avatar--pointer',
				className
			),
			style: cssVars || undefined,
			role: ariaLabel ? 'img' : undefined,
			'aria-label': ariaLabel,
			[refKey]: refAttach
		})
	);
</script>

{#snippet inner()}
	{#if loading}
		<div class="avatar__loading" aria-hidden="true">
			<Spinner color="#fff" size="60%" thickness={3.5} speed={800} />
		</div>
	{/if}

	<div class="avatar__body">
		{@render children?.()}
	</div>

	{#if isLatest && hiddenCount > 0}
		<div class="avatar__latest" role="img" aria-label={`+${hiddenCount} ${moreLabel}`}>
			<span aria-hidden="true">+{hiddenCount}</span>
		</div>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: rootProps })}
{:else}
	<div {...rootProps}>
		{@render inner()}
	</div>
{/if}

<style>
	:where(.avatar) {
		--c: var(--gray-2);
		--b: var(--primary);
		--avatar-size: 44px;
		--avatar-radius: 35%;
		--avatar-ease: cubic-bezier(0.4, 0, 0.2, 1);
		--avatar-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
		--avatar-duration: 250ms;

		position: relative;
		z-index: 1;
		display: inline-block;
		box-sizing: border-box;
		width: var(--avatar-size);
		height: var(--avatar-size);
		font-size: calc(var(--avatar-size) * 0.36);
		border-radius: var(--avatar-radius);
		-webkit-user-select: none;
		user-select: none;
		transition:
			transform var(--dur-slow) var(--avatar-elastic),
			box-shadow var(--avatar-duration) var(--avatar-ease);
	}

	:where(.avatar--pointer) { cursor: pointer; }
	:where(.avatar[data-hidden]) { display: none; }

	:where(.avatar[data-shape='circle']) { border-radius: var(--rad-circle); }
	:where(.avatar[data-shape='square']) { border-radius: 15%; }

	:where(.avatar--has-icons) { isolation: isolate; }

	.avatar__body {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		overflow: visible;
		background: rgb(var(--c));
		color: rgb(var(--text));
		border-radius: inherit;
		box-shadow: inset 0 0 0 0 rgb(0 0 0 / 0.05);
		transition:
			box-shadow var(--avatar-duration) var(--avatar-ease),
			background-color var(--avatar-duration) var(--avatar-ease),
			color var(--avatar-duration) var(--avatar-ease);
	}

	.avatar--has-color .avatar__body { color: rgb(var(--on-accent)); }

	.avatar__body :global(.avatar__img) {
		width: 100%;
		height: auto;
		display: block;
		border-radius: inherit;
		transition: transform var(--dur-slow) var(--avatar-elastic) 160ms;
	}

	.avatar__body :global(svg),
	.avatar__body :global(i) {
		font-size: var(--fs-xl);
		transition: transform var(--dur-slow) var(--avatar-elastic) 160ms;
	}
	.avatar__body :global(.avatar__icons svg),
	.avatar__body :global(.avatar__icons i) {
		font-size: var(--fs-md);
	}

	.avatar:hover .avatar__body :global(.avatar__img),
	.avatar:hover .avatar__body :global(svg),
	.avatar:hover .avatar__body :global(i) { transition-delay: 0ms; }

	.avatar:hover .avatar__body {
		box-shadow: inset 0 0 40px 0 rgb(0 0 0 / 0.04);
	}
	.avatar--has-color:hover .avatar__body {
		box-shadow: inset 0 0 40px 0 rgb(0 0 0 / 0.1);
	}
	.avatar:hover .avatar__body :global(.avatar__img),
	.avatar:hover .avatar__body :global(svg),
	.avatar:hover .avatar__body :global(i) { transform: scale(1.12); }

	.avatar:hover :global(.avatar__badge) { transform: scale(1.18); }

	:where(.avatar--history) { padding: 0; }
	.avatar--history .avatar__body {
		width: calc(100% - 4px);
		height: calc(100% - 4px);
		margin: var(--space-1);
		border: 2px solid rgb(var(--background));
		box-sizing: border-box;
		transform-origin: center;
		transition:
			transform var(--dur-slow) var(--avatar-elastic),
			box-shadow var(--avatar-duration) var(--avatar-ease),
			background-color var(--avatar-duration) var(--avatar-ease),
			color var(--avatar-duration) var(--avatar-ease);
	}
	.avatar--history:hover .avatar__body {
		transform: scale(0.94);
	}
	.avatar--history::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: rgb(var(--c));
		z-index: -2;
		pointer-events: none;
	}
	.avatar--history-gradient::after {
		background: linear-gradient(
			40deg,
			rgb(var(--warn)) 0%,
			rgb(var(--danger)) 74%,
			rgb(var(--primary)) 74%
		);
	}

	.avatar--history::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: conic-gradient(
			from var(--avatar-ring-angle, 0deg),
			rgb(var(--c)) 0deg,
			rgb(var(--c) / 0.35) 90deg,
			rgb(var(--c)) 180deg,
			rgb(var(--c) / 0.35) 270deg,
			rgb(var(--c)) 360deg
		);
		z-index: -1;
		opacity: 0;
		transition: opacity var(--dur-slow) var(--avatar-elastic);
		pointer-events: none;
	}
	.avatar--history-gradient::before {
		background: conic-gradient(
			from var(--avatar-ring-angle, 0deg),
			rgb(var(--warn)) 0deg,
			rgb(var(--danger)) 120deg,
			rgb(var(--primary)) 240deg,
			rgb(var(--warn)) 360deg
		);
	}
	.avatar--history:hover::before {
		opacity: 1;
		animation: avatar-ring-spin 3.5s linear infinite;
	}

	@property --avatar-ring-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	@keyframes avatar-ring-spin {
		to { --avatar-ring-angle: 360deg; }
	}

	.avatar__loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(0 0 0 / 0.5);
		border-radius: inherit;
		z-index: 100;
	}
	.avatar__latest {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(0 0 0 / 0.5);
		color: rgb(255 255 255);
		font-weight: 600;
		-webkit-user-select: none;
		user-select: none;
		border-radius: inherit;
		z-index: 300;
	}

	:where(.avatar--icons-vertical) { margin-right: var(--avatar-icons-clearance, 2px); }

	.avatar[data-in-group]:not([data-group-float]):hover .avatar__body {
		box-shadow: inset 0 0 0 0 rgb(0 0 0 / 0.1);
	}
	.avatar[data-in-group]:not([data-group-float]):hover .avatar__body :global(.avatar__img),
	.avatar[data-in-group]:not([data-group-float]):hover .avatar__body :global(svg),
	.avatar[data-in-group]:not([data-group-float]):hover .avatar__body :global(i),
	.avatar[data-in-group]:not([data-group-float]):hover :global(.avatar__text) {
		transform: scale(1);
	}
	.avatar[data-in-group]:not([data-group-float]) .avatar__body :global(.avatar__img) {
		width: calc(100% - 6px);
	}

	.avatar[data-group-float] {
		position: relative;
		z-index: 2;
		border: 3px solid rgb(var(--background));
		margin: 0;
	}
</style>
