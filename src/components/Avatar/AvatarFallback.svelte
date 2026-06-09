<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AvatarFallbackProps = WithElementRef<
		{
			/** Initials/icon shown while the image is loading or errored. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Pre-computed letter count for SSR-stable font scaling; self-measured when omitted. */
			letters?: number;
		} & HTMLAttributes<HTMLSpanElement>
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { dataState } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getAvatarContext } from './context';

	let {
		children,
		child,
		letters,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: AvatarFallbackProps = $props();

	const root = getAvatarContext();
	const refKey = createAttachmentKey();

	let labelEl = $state<HTMLSpanElement | null>(null);
	let measuredCount = $state(0);

	function countLetters(raw: string): number {
		if (!raw) return 0;
		return raw.length > 5 ? raw.split(/\s+/).filter(Boolean).length : raw.length;
	}

	$effect(() => {
		const el = labelEl;
		if (letters !== undefined || !el) return;
		const measure = () => {
			const next = countLetters(el.textContent?.trim() ?? '');
			untrack(() => {
				if (measuredCount !== next) measuredCount = next;
			});
		};
		measure();
		const observer = new MutationObserver(measure);
		observer.observe(el, { childList: true, characterData: true, subtree: true });
		return () => observer.disconnect();
	});

	let letterCount = $derived(letters ?? measuredCount);
	let isHidden = $derived(root.status === 'loaded');

	const styleParts = $derived(
		[`--n:${letterCount}`, isHidden ? 'display:none' : undefined, userStyle].filter(Boolean).join(';')
	);

	const fallbackProps = $derived(
		mergeProps(rest, {
			class: cn('avatar__text', className),
			'data-avatar-fallback': '',
			'data-status': dataState(root.status),
			style: styleParts,
			[refKey]: attachRef<HTMLSpanElement>((n) => {
				ref = n;
				labelEl = n;
			})
		})
	);
</script>

{#if child}
	{@render child({ props: fallbackProps })}
{:else}
	<span {...fallbackProps}>{@render children?.()}</span>
{/if}

<style>
	.avatar__text {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		font-weight: 600;
		line-height: var(--line-height);
		font-size: max(0.6em, calc(1em - max(var(--n) - 2, 0) * 0.1em));
		transition: transform var(--dur-slow) var(--avatar-elastic) 160ms;
	}
	:global(.avatar:hover) .avatar__text { transform: scale(1.12); transition-delay: 0ms; }
</style>
