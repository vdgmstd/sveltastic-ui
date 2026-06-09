<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type TextareaFieldProps = WithElementRef<
		{
			/** Accessible name when no visible label is rendered. */
			ariaLabel?: string;
			/** Render-delegation (bits-ui v2 `child`): replaces the native `<textarea>` with your own control. Receives the merged field props (id, `data-*`, `aria-*`, handlers, ref) to spread. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLTextareaAttributes, 'value' | 'children'>,
		HTMLTextAreaElement
	>;
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mask as maskAction } from '../../actions/mask';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { cn } from '../../utils/cn';
	import { useTextareaCtx } from './context';

	let {
		ariaLabel,
		child,
		ref = $bindable(null),
		placeholder,
		class: className,
		...rest
	}: TextareaFieldProps = $props();

	const ctx = useTextareaCtx();

	let textareaEl: HTMLTextAreaElement | undefined = $state();

	// Fake placeholder — the kit's animated placeholder; native is blanked. Float/inline modes use Textarea.Label instead.
	let showFakePlaceholder = $derived(!!placeholder && ctx.labelStyle === 'default' && !ctx.hasMask);

	async function grow(): Promise<void> {
		if (!ctx.autoGrow || !textareaEl) return;
		await tick();
		textareaEl.style.height = 'auto';
		textareaEl.style.height = `${textareaEl.scrollHeight}px`;
	}

	$effect(() => {
		void ctx.value;
		grow();
	});

	$effect(() => {
		if (!ctx.autoGrow || !textareaEl) return;
		const ro = new ResizeObserver(() => grow());
		ro.observe(textareaEl);
		return () => ro.disconnect();
	});

	$effect(() => {
		ctx.hasValue = ctx.value !== '';
	});

	const refKey = createAttachmentKey();

	const fieldProps = $derived(
		mergeProps(rest, {
			class: cn('textarea__field', className),
			id: ctx.id,
			placeholder: '',
			disabled: ctx.disabled,
			readonly: ctx.readonly,
			'aria-label': ariaLabel,
			'aria-invalid': ctx.fieldState === 'danger' ? true : undefined,
			'aria-describedby': ctx.hasMessage ? ctx.messageId : undefined,
			'data-state': dataState(ctx.focusedActive ? 'focused' : undefined),
			'data-disabled': boolAttr(ctx.disabled),
			'data-field-state': dataState(ctx.fieldState !== 'default' ? ctx.fieldState : undefined),
			oninput: grow,
			[refKey]: attachRef<HTMLTextAreaElement>((n) => {
				ref = n;
				textareaEl = n ?? undefined;
			})
		})
	);
</script>

{#if child}
	{@render child({ props: fieldProps })}
{:else}
	<textarea
		bind:value={() => ctx.value, (v) => ctx.setValue(v)}
		use:maskAction={ctx.mask}
		{...fieldProps}
	></textarea>
	{#if showFakePlaceholder}
		<span class="textarea__label" aria-hidden="true">{placeholder}</span>
	{/if}
{/if}
