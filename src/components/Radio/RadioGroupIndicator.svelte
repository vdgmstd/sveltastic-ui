<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type RadioGroupIndicatorProps = WithElementRef<
		{
			/** Optional glyph rendered as the active indicator instead of the dot. Hidden until selected. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own disc element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import Spinner from '../../primitives/Spinner.svelte';
	import { useRadioItemContext } from './context';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		style: userStyle,
		...rest
	}: RadioGroupIndicatorProps = $props();

	const item = useRadioItemContext();
	if (!item) throw new Error('<RadioGroup.Indicator> must be used within <RadioGroup.Item>');

	const SPINNER_SIZE = 18;
	const SPINNER_THICKNESS = 2.4;

	// Stable attach (item narrowed here) — registers the input with roving once, deregisters on unmount.
	const registerInput = (node: HTMLElement) => item.registerInput(node);

	const refKey = createAttachmentKey();
	const discAttrs = $derived({
		class: 'radio__disc',
		'data-testid': 'radio-group-indicator',
		'data-has-icon': boolAttr(!!children)
	});
	const merged = $derived(
		mergeProps(rest, discAttrs, {
			class: className,
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
	let cssVars = $derived(`--ps:${item.pressScale};${userStyle ?? ''}`);
</script>

{#snippet disc()}
	<input {...item!.inputAttrs} {@attach registerInput} />
	<span class="radio__effect" aria-hidden="true">
		{#if children}
			<span class="radio__icon">{@render children()}</span>
		{/if}
		<span class="radio__mark"></span>
		{#if item!.isLoading}
			<span class="radio__loading">
				<Spinner color={item!.color} size={SPINNER_SIZE} thickness={SPINNER_THICKNESS} speed={800} />
			</span>
		{/if}
	</span>
{/snippet}

{#if child}
	{@render child({ props: { ...merged, style: cssVars } })}
{:else}
	<span {...merged} style={cssVars}>
		{@render disc()}
	</span>
{/if}
