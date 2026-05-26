<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape } from '../../types';

	export type AvatarBadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
	export type AvatarIconsPlacement = 'vertical' | 'horizontal';

	export type AvatarProps = {
		/** Palette name or hex / `rgb(...)` / `r,g,b`. When unset, the neutral gray-2 token is used. */
		color?: Color;
		/** Badge placement. Defaults to `bottom-right`. */
		badgePosition?: AvatarBadgePosition;
		/** Show `cursor: pointer` on hover. */
		pointer?: boolean;
		/** `default` squircle, `circle` perfect round, `square` for kit-radius corners. */
		shape?: Shape;
		/** Colored "story" ring around the avatar. */
		history?: boolean;
		/** When `history` is set, use the Instagram-style three-stop gradient ring. */
		historyGradient?: boolean;
		/** Full-cover overlay with a two-ring spinner. */
		loading?: boolean;
		/** Badge renders a bouncing three-dot "typing" indicator. */
		writing?: boolean;
		/** Show the default dot badge (only when no `badgeContent` snippet is provided). */
		badge?: boolean;
		/** Badge background color. Defaults to `--primary`. */
		badgeColor?: Color;
		/** Width and height in px. Number or numeric string. */
		size?: number | string;
		/** Letter fallback. String form drives deterministic initials and font scaling. */
		text?: string | Snippet;
		/** Primary content (image or icon). */
		children?: Snippet;
		/** Rich badge content. Overrides the default dot when provided. */
		badgeContent?: Snippet;
		/** Strip of action icons hugging the avatar edge; each icon is rendered as a cut-out badge. */
		icons?: Snippet;
		/** Layout for the icon strip. `vertical` hugs the right edge, `horizontal` the bottom. */
		iconsPlacement?: AvatarIconsPlacement;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'color'>;

	export type AvatarRegistration = {
		index: number;
		total: number;
		max: number | undefined;
		float: boolean;
	};

	export type AvatarGroupContext = {
		register(): { state: () => AvatarRegistration; unregister(): void };
	};

	export const AVATAR_GROUP_KEY = Symbol('avatar-group');
</script>

<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import { scale } from 'svelte/transition';
	import { backOut, backIn } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import Spinner from '../../primitives/Spinner.svelte';

	const badgeIn = { duration: 320, start: 0, easing: backOut };
	const badgeOut = { duration: 200, start: 0, easing: backIn };

	let {
		color,
		badgePosition = 'bottom-right',
		pointer = false,
		shape = 'default',
		history = false,
		historyGradient = false,
		loading = false,
		writing = false,
		badge = false,
		badgeColor,
		size,
		text,
		children,
		badgeContent,
		icons,
		iconsPlacement = 'vertical',
		class: className,
		style: userStyle,
		...rest
	}: AvatarProps = $props();

	const group = getContext<AvatarGroupContext | undefined>(AVATAR_GROUP_KEY);
	const registration = group?.register();

	$effect(() => () => registration?.unregister());

	let groupState = $derived(registration?.state());
	let index = $derived(groupState?.index ?? -1);
	let total = $derived(groupState?.total ?? 0);
	let max = $derived(groupState?.max);
	let groupFloat = $derived(groupState?.float ?? false);
	let isHidden = $derived(max !== undefined && index >= 0 && index > max - 1);
	let isLatest = $derived(max !== undefined && index === max - 1 && total > max);
	let hiddenCount = $derived(isLatest ? total - (max ?? 0) : 0);

	let hasColor = $derived(color !== undefined && color !== '');
	let colorTriplet = $derived(hasColor ? rgbTriplet(color) : undefined);
	let badgeTriplet = $derived(
		badgeColor !== undefined && badgeColor !== '' ? rgbTriplet(badgeColor) : undefined
	);

	let sizePx = $derived(size === undefined || size === '' ? undefined : `${size}px`);

	let textString = $derived(typeof text === 'string' ? text.trim() : '');
	let letters = $derived.by(() => {
		if (!textString) return [] as string[];
		if (textString.length > 5) return textString.split(/\s+/).filter(Boolean).map((w) => w[0]);
		return textString.split('');
	});

	let labelEl: HTMLSpanElement | undefined = $state();
	let snippetLetterCount = $state(0);

	$effect(() => {
		const el = labelEl;
		if (typeof text === 'string' || !el) {
			untrack(() => {
				if (snippetLetterCount !== 0) snippetLetterCount = 0;
			});
			return;
		}
		const raw = el.textContent?.trim() ?? '';
		const next = !raw ? 0 : raw.length > 5 ? raw.split(/\s+/).filter(Boolean).length : raw.length;
		untrack(() => {
			if (snippetLetterCount !== next) snippetLetterCount = next;
		});
	});

	let letterCount = $derived(typeof text === 'string' ? letters.length : snippetLetterCount);
</script>

<div
	class={cn(
		'avatar',
		`avatar--badge-${badgePosition}`,
		`avatar--shape-${shape}`,
		hasColor && 'avatar--has-color',
		history && 'avatar--history',
		history && historyGradient && 'avatar--history-gradient',
		!!icons && 'avatar--has-icons',
		!!icons && iconsPlacement === 'vertical' && 'avatar--icons-vertical',
		!!icons && iconsPlacement === 'horizontal' && 'avatar--icons-horizontal',
		isHidden && 'avatar--hidden',
		pointer && 'avatar--pointer',
		sizePx !== undefined && 'avatar--has-size',
		groupFloat && 'avatar--group-float',
		!!registration && 'avatar--in-group',
		className
	)}
	style:--c={colorTriplet}
	style:--b={badgeTriplet}
	style:--n={letterCount}
	style:--avatar-size={sizePx}
	style={userStyle}
	data-testid="avatar"
	{...rest}
>
	{#if loading}
		<div class="avatar__loading" aria-hidden="true">
			<Spinner color="#fff" size="60%" thickness={3.5} speed={800} />
		</div>
	{/if}

	<div class="avatar__body">
		{#if typeof text === 'string'}
			{#if letters.length > 0}
				<span class="avatar__text">
					{#each letters as letter, i (i)}<span>{letter}</span>{/each}
				</span>
			{/if}
		{:else if text}
			<span class="avatar__text" bind:this={labelEl}>
				{@render text()}
			</span>
		{/if}
		{@render children?.()}
	</div>

	{#if badgeContent || badge || writing}
		<div
			class="avatar__badge avatar__badge--{badgePosition}"
			class:avatar__badge--filled={!!badgeContent || writing}
			class:avatar__badge--writing={writing}
			in:scale={badgeIn}
			out:scale={badgeOut}
		>
			{#if writing}
				<div class="avatar__points" aria-hidden="true">
					<span class="avatar__points__point"></span>
					<span class="avatar__points__point"></span>
					<span class="avatar__points__point"></span>
				</div>
			{:else if badgeContent}
				{@render badgeContent()}
			{/if}
		</div>
	{/if}

	{#if isLatest && hiddenCount > 0}
		<div class="avatar__latest" aria-label={`+${hiddenCount}`}>+{hiddenCount}</div>
	{/if}

	{#if icons}
		<div class="avatar__icons">
			{@render icons()}
		</div>
	{/if}
</div>

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
		user-select: none;
		transition:
			transform 360ms var(--avatar-elastic),
			box-shadow var(--avatar-duration) var(--avatar-ease);
	}

	:where(.avatar--pointer) { cursor: pointer; }
	:where(.avatar--hidden) { display: none; }

	:where(.avatar--shape-circle) { border-radius: 50%; }
	:where(.avatar--shape-square) { border-radius: 15%; }

	:where(.avatar--has-icons) { isolation: isolate; }

	.avatar__body {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
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

	.avatar__body :global(img) {
		width: 100%;
		height: auto;
		display: block;
		border-radius: inherit;
		transition: transform 360ms var(--avatar-elastic) 160ms;
	}

	.avatar__body :global(svg),
	.avatar__body :global(i) {
		font-size: 1.4rem;
		transition: transform 360ms var(--avatar-elastic) 160ms;
	}

	.avatar:hover .avatar__body :global(img),
	.avatar:hover .avatar__body :global(svg),
	.avatar:hover .avatar__body :global(i) { transition-delay: 0ms; }

	.avatar:hover .avatar__body {
		box-shadow: inset 0 0 40px 0 rgb(0 0 0 / 0.04);
	}
	.avatar--has-color:hover .avatar__body {
		box-shadow: inset 0 0 40px 0 rgb(0 0 0 / 0.1);
	}
	.avatar:hover .avatar__body :global(img),
	.avatar:hover .avatar__body :global(svg),
	.avatar:hover .avatar__body :global(i) { transform: scale(1.12); }

	.avatar:hover .avatar__badge { transform: scale(1.18); }

	.avatar__text {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		font-weight: 600;
		line-height: var(--line-height);
		font-size: max(0.6em, calc(1em - max(var(--n) - 2, 0) * 0.1em));
		transition: transform 360ms var(--avatar-elastic) 160ms;
	}
	.avatar:hover .avatar__text { transform: scale(1.12); transition-delay: 0ms; }

	:where(.avatar--history) { padding: 0; }
	.avatar--history .avatar__body {
		width: calc(100% - 4px);
		height: calc(100% - 4px);
		margin: 2px;
		border: 2px solid rgb(var(--background));
		box-sizing: border-box;
		transform-origin: center;
		transition:
			transform 360ms var(--avatar-elastic),
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
		transition: opacity 360ms var(--avatar-elastic);
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

	.avatar__badge {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 13px;
		height: 13px;
		background: rgb(var(--b));
		border: 2px solid rgb(var(--background));
		border-radius: 50%;
		color: rgb(var(--on-accent));
		font-size: 0.6rem;
		font-weight: 600;
		line-height: var(--line-height);
		z-index: 200;
		box-sizing: border-box;
		transform-origin: center;
		transition: transform 360ms var(--avatar-elastic) 80ms;
	}
	.avatar:hover .avatar__badge { transition-delay: 80ms; }
	.avatar__badge--top-right { top: -4px; right: -4px; }
	.avatar__badge--top-left { top: -4px; left: -4px; }
	.avatar__badge--bottom-left { bottom: -4px; left: -4px; }
	.avatar__badge--bottom-right { bottom: -4px; right: -4px; }

	.avatar__badge--filled {
		width: auto;
		height: auto;
		min-width: 18px;
		min-height: 18px;
		padding: 0 3px;
		border-radius: 7px;
	}

	.avatar--shape-circle .avatar__badge--top-right { top: -2px; right: -2px; }
	.avatar--shape-circle .avatar__badge--top-left { top: -2px; left: -2px; }
	.avatar--shape-circle .avatar__badge--bottom-left { bottom: -2px; left: -2px; }
	.avatar--shape-circle .avatar__badge--bottom-right { bottom: -2px; right: -2px; }

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
		margin: 0 2px;
		border-radius: 50%;
		background: rgb(var(--on-accent));
		animation: avatar-point 1200ms ease infinite;
	}
	.avatar__points__point:nth-child(2) { animation-delay: 400ms; }
	.avatar__points__point:nth-child(3) { animation-delay: 800ms; }

	@keyframes avatar-point {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.5); }
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
		user-select: none;
		border-radius: inherit;
		z-index: 300;
	}

	.avatar__icons {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 3px 4px;
		background: rgb(var(--b));
		color: rgb(var(--on-accent));
		border: 2px solid rgb(var(--background));
		border-radius: 50vmax;
		font-size: 0.625rem;
		opacity: 0;
		pointer-events: none;
		z-index: 3;
		transition:
			transform 360ms var(--avatar-elastic),
			opacity 200ms var(--avatar-ease);
		transition-delay: 0ms;
	}
	.avatar--has-icons:hover .avatar__icons { transition-delay: 160ms; }
	:where(.avatar--icons-vertical) { margin-right: var(--avatar-icons-clearance, 2px); }

	.avatar--icons-vertical .avatar__icons {
		top: 50%;
		right: 0;
		flex-direction: column;
		transform: translate(calc(75% + 2px), -50%);
	}
	.avatar--icons-horizontal .avatar__icons {
		left: 50%;
		bottom: 0;
		flex-direction: row;
		transform: translate(-50%, calc(50% + 2px));
	}
	.avatar--has-icons:hover .avatar__icons {
		opacity: 1;
		pointer-events: auto;
	}
	.avatar--icons-vertical:hover .avatar__icons {
		transform: translate(60%, -50%);
	}
	.avatar--icons-horizontal:hover .avatar__icons {
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

	.avatar--in-group:not(.avatar--group-float):hover .avatar__body {
		box-shadow: inset 0 0 0 0 rgb(0 0 0 / 0.1);
	}
	.avatar--in-group:not(.avatar--group-float):hover .avatar__body :global(img),
	.avatar--in-group:not(.avatar--group-float):hover .avatar__body :global(svg),
	.avatar--in-group:not(.avatar--group-float):hover .avatar__body :global(i),
	.avatar--in-group:not(.avatar--group-float):hover .avatar__text {
		transform: scale(1);
	}
	.avatar--in-group:not(.avatar--group-float) .avatar__body :global(img) {
		width: calc(100% - 6px);
	}

	.avatar--group-float {
		position: relative;
		z-index: 2;
		border: 3px solid rgb(var(--background));
		margin: 0;
	}
</style>
