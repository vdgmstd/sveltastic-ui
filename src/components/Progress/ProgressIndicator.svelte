<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ProgressIndicatorProps = WithElementRef<
		{
			/** Animated diagonal stripes overlay (linear, determinate only). */
			stripes?: boolean;
			/** Render-delegation: receive the merged props and render your own indicator element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import Spinner from '../../primitives/Spinner.svelte';
	import { useProgressCtx } from './context';

	let {
		stripes = false,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: ProgressIndicatorProps = $props();

	const ctx = useProgressCtx();
	let isCircular = $derived(ctx.shape === 'circular');
	let showStripes = $derived(stripes && !ctx.isIndeterminate && !isCircular);
	let triplet = $derived(ctx.triplet);

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('progress__bar', className),
			'aria-hidden': true,
			'data-indeterminate': boolAttr(ctx.isIndeterminate),
			'data-stripes': boolAttr(showStripes),
			'data-testid': 'progress-indicator',
			[refKey]: attachRef((n) => (ref = n as HTMLDivElement))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else if isCircular}
	{#if ctx.isIndeterminate}
		<Spinner color={ctx.color} size={ctx.size} thickness={ctx.thickness} speed={800} />
	{:else}
		<svg class="progress__svg progress__svg--ring" viewBox="0 0 {ctx.size} {ctx.size}" aria-hidden="true">
			<defs>
				<linearGradient
					id={ctx.gradId}
					gradientUnits="userSpaceOnUse"
					x1={ctx.size / 2}
					y1={0}
					x2={ctx.size / 2}
					y2={ctx.size}
				>
					<stop offset="0%" stop-color="rgb({triplet})" />
					<stop offset="100%" stop-color="color-mix(in srgb, rgb({triplet}), white 55%)" />
				</linearGradient>
			</defs>
			<circle
				class="progress__ring"
				cx={ctx.size / 2}
				cy={ctx.size / 2}
				r={ctx.radius}
				stroke-width={ctx.thickness}
				stroke="url(#{ctx.gradId})"
				fill="none"
				stroke-dasharray={ctx.circumference}
				stroke-dashoffset={ctx.dashOffset}
				transform="rotate(-90 {ctx.size / 2} {ctx.size / 2})"
			/>
		</svg>
	{/if}
{:else}
	<div {...merged} style:width={ctx.isIndeterminate ? undefined : `${ctx.pct}%`}></div>
{/if}

<style>
	.progress__bar {
		position: absolute;
		inset: 0 auto 0 0;
		background: linear-gradient(
			to right,
			rgb(var(--c)) 0%,
			color-mix(in srgb, rgb(var(--c)), white 35%) 100%
		);
		border-radius: var(--rad-pill);
	}

	.progress__bar[data-stripes] {
		background-image:
			linear-gradient(
				45deg,
				color-mix(in srgb, rgb(var(--c)), white 45%) 25%,
				transparent 25%,
				transparent 50%,
				color-mix(in srgb, rgb(var(--c)), white 45%) 50%,
				color-mix(in srgb, rgb(var(--c)), white 45%) 75%,
				transparent 75%,
				transparent
			),
			linear-gradient(
				to right,
				rgb(var(--c)) 0%,
				color-mix(in srgb, rgb(var(--c)), white 35%) 100%
			);
		background-size: 16px 16px, auto;
		background-repeat: repeat, no-repeat;
		animation: progress-stripes 1s linear infinite;
	}

	.progress__bar[data-indeterminate] {
		width: 40%;
		animation: progress-slide 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.progress__svg--ring {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.progress__ring {
		stroke-linecap: round;
		filter: drop-shadow(0 0 3px rgb(var(--c) / 0.45));
	}

	@keyframes progress-stripes {
		from {
			background-position: 0 0, 0 0;
		}
		to {
			background-position: 16px 0, 0 0;
		}
	}
	@keyframes progress-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(250%);
		}
	}
</style>
