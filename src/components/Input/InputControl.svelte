<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputControlProps = WithElementRef<
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
	import Spinner from '../../primitives/Spinner.svelte';
	import { useInputCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: InputControlProps =
		$props();
	const ctx = useInputCtx();

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
			class: cn('input__field', className),
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
		{#if ctx.loading}
			<span class="input__loading" aria-hidden="true">
				<Spinner color={ctx.color} size={22} thickness={3} speed={800} />
			</span>
		{/if}
		{#if ctx.variant === 'border'}
			<span class="input__underline" aria-hidden="true"></span>
		{/if}
		{#if ctx.variant === 'shadow'}
			<span class="input__shadow" aria-hidden="true"></span>
		{/if}
	</div>
{/if}
