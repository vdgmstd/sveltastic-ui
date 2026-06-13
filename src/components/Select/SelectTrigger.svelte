<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type SelectTriggerProps<V = unknown> = WithElementRef<
		Omit<HTMLInputAttributes, 'value' | 'children'> & {
			children?: Snippet;
			/** Render-delegation: replace the whole field. Receives the merged combobox props. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLElement
	>;
</script>

<script lang="ts" generics="V">
	import { createAttachmentKey } from 'svelte/attachments';
	import { CaretDownIcon } from 'phosphor-svelte';
	import InputShell from '../../primitives/InputShell.svelte';
	import SelectValueBody from './SelectValueBody.svelte';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState, boolAttr } from '../../utils/attrs';
	import { getSelectCtx } from './context';

	let { ref = $bindable(null), children, child, ...rest }: SelectTriggerProps<V> = $props();
	const root = getSelectCtx<V>();

	let usesInputField = $derived(root.isMultiple || root.hasCustomValue);
	let isEmpty = $derived(
		root.isMultiple ? root.chipItems.length === 0 : !root.selectedItem && !root.displayLabel
	);

	function handleInput(e: Event): void {
		if (!root.filter) return;
		root.setFilterText((e.currentTarget as HTMLInputElement).value);
	}
	function handleClick(e: MouseEvent): void {
		if (root.filter && root.open) e.stopPropagation();
	}

	const refKey = createAttachmentKey();
	// Mint once: an inline attachment in the $derived bag re-runs every recompute (open → data-state change), churning the field and evicting the focus bloom.
	const refAttach = attachRef<HTMLElement>((n) => (ref = n));
	const attrs = $derived({
		'aria-autocomplete': 'list' as const,
		'aria-activedescendant': root.open ? root.activeId : undefined,
		'aria-label': root.ariaLabel,
		'data-state': dataState(root.open ? 'open' : 'closed'),
		'data-disabled': boolAttr(root.disabled),
		'data-placeholder': boolAttr(isEmpty)
	});
	const merged = $derived(mergeProps(rest, attrs, { [refKey]: refAttach }));

	$effect(() => {
		root.triggerSnippet = triggerBody;
		return () => {
			if (root.triggerSnippet === triggerBody) root.triggerSnippet = undefined;
		};
	});
</script>

{#snippet caretIcon()}
	<span class="select__caret" data-state={dataState(root.open ? 'open' : 'closed')}>
		{#if root.iconSnippet}
			{@render root.iconSnippet()}
		{:else}
			<CaretDownIcon size={14} weight="bold" />
		{/if}
	</span>
{/snippet}

{#snippet triggerBody(popoverProps: Record<string, unknown>)}
	{@const full = mergeProps(merged, popoverProps)}
	{@const slotHost =
		usesInputField && !root.filter
			? mergeProps(full, { tabindex: 0, onkeydown: root.handleTriggerKeydown })
			: undefined}
	{@render children?.()}
	{#if child}
		{@render child({ props: full })}
	{:else}
		<InputShell
			value={root.inputValue}
			color={root.color}
			iconColor={root.color}
			iconPosition="after"
			variant={root.variant}
			fieldState={root.fieldState}
			block={root.block}
			disabled={root.disabled}
			label={root.label}
			labelStyle={root.labelStyle}
			placeholder={root.placeholder}
			loading={root.loading}
			readonly={!root.filter}
			forceFocus={root.open}
			id={root.triggerId}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck={false}
			icon={caretIcon}
			control={usesInputField ? inputField : undefined}
			controlHostProps={slotHost}
			oninput={handleInput}
			onclick={handleClick}
			onkeydown={root.handleTriggerKeydown}
			{...full}
		/>
	{/if}
{/snippet}

{#snippet inputField()}
	{#if root.valueSnippet}
		{@render root.valueSnippet()}
	{:else}
		<SelectValueBody />
	{/if}
{/snippet}

<style>
	.select__caret {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		-webkit-user-select: none;
		user-select: none;
		transition: transform 140ms var(--ease-standard);
	}
	.select__caret[data-state='open'] {
		transform: rotate(180deg);
	}
</style>
