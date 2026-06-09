<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type TextareaControlProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		}
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import type { Attachment } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { surfaceRipple } from '../../actions/surfaceRipple.svelte';
	import { useTextareaCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: TextareaControlProps =
		$props();
	const ctx = useTextareaCtx();

	const refKey = createAttachmentKey();

	const ripple: Attachment<HTMLDivElement> = (node) => {
		const handle = surfaceRipple(node, { mode: 'focus', disabled: ctx.variant === 'border' });
		return handle ? () => handle.destroy?.() : undefined;
	};
	const rippleKey = createAttachmentKey();

	function handleFocusin(): void {
		ctx.focused = true;
	}
	function handleFocusout(event: FocusEvent): void {
		const next = event.relatedTarget as Node | null;
		const wrapper = event.currentTarget as HTMLElement;
		if (next && wrapper.contains(next)) return;
		ctx.focused = false;
	}

	const merged = $derived(
		mergeProps(rest, {
			class: cn('textarea__field-wrap', className),
			onfocusin: handleFocusin,
			onfocusout: handleFocusout,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n)),
			[rippleKey]: ripple
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{@render children?.()}
		{#if ctx.variant === 'border'}
			<span class="textarea__underline" aria-hidden="true"></span>
		{/if}
		{#if ctx.variant === 'shadow'}
			<span class="textarea__shadow" aria-hidden="true"></span>
		{/if}
	</div>
{/if}
