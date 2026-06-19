<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ComboboxInputProps<V = unknown> = WithElementRef<
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
	import { scale } from 'svelte/transition';
	import { CaretDownIcon } from 'phosphor-svelte';
	import InputShell from '../../primitives/InputShell.svelte';
	import { Chip } from '../Chip';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState, boolAttr } from '../../utils/attrs';
	import { getComboboxCtx } from './context';

	let { ref = $bindable(null), children, child, ...rest }: ComboboxInputProps<V> = $props();
	const root = getComboboxCtx<V>();

	let isEmpty = $derived(root.isMultiple ? root.chipItems.length === 0 : !root.displayValue);

	function handleInput(e: Event): void {
		root.setInputValue((e.currentTarget as HTMLInputElement).value);
	}
	function handleClick(e: MouseEvent): void {
		if (root.open) e.stopPropagation();
	}

	const refKey = createAttachmentKey();
	const refAttach = attachRef<HTMLElement>((n) => (ref = n));
	const attrs = $derived({
		'aria-autocomplete': 'list' as const,
		'aria-activedescendant': root.open ? root.activeId : undefined,
		'aria-label': root.ariaLabel,
		'data-state': dataState(root.open ? 'open' : 'closed'),
		'data-disabled': boolAttr(root.disabled),
		'data-placeholder': boolAttr(isEmpty),
		'data-combobox-input': ''
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
	<span class="combobox__caret" data-state={dataState(root.open ? 'open' : 'closed')}>
		{#if root.iconSnippet}
			{@render root.iconSnippet()}
		{:else}
			<CaretDownIcon size={14} weight="bold" />
		{/if}
	</span>
{/snippet}

{#snippet triggerBody(popoverProps: Record<string, unknown>)}
	{@const full = mergeProps(merged, popoverProps)}
	{@render children?.()}
	{#if child}
		{@render child({ props: full })}
	{:else}
		<InputShell
			value={root.displayValue}
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
			forceFocus={root.open}
			id={root.inputId}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck={false}
			icon={caretIcon}
			control={root.isMultiple ? chipsControl : undefined}
			oninput={handleInput}
			onclick={handleClick}
			onkeydown={root.handleInputKeydown}
			{...full}
		/>
	{/if}
{/snippet}

{#snippet chipsControl()}
	<div class="combobox__chips" data-placeholder={root.chipItems.length === 0 ? '' : undefined}>
		{#each root.chipItems as item (item.value)}
			<span
				class="combobox__chip-wrap"
				in:scale={{ duration: 160, start: 0.7, opacity: 0 }}
				out:scale={{ duration: 140, start: 0.7, opacity: 0 }}
			>
				<Chip.Root color={root.color} size="small">
					{item.label}
					<Chip.Close onclose={() => root.removeChip(item.value)} />
				</Chip.Root>
			</span>
		{/each}
		<input
			class="combobox__filter"
			type="text"
			size="1"
			value={root.inputValue}
			placeholder={root.chipItems.length === 0 ? root.placeholder : ''}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
			aria-autocomplete="list"
			aria-label={root.ariaLabel}
			aria-activedescendant={root.open ? root.activeId : undefined}
			oninput={handleInput}
			onclick={handleClick}
			onkeydown={root.handleInputKeydown}
		/>
	</div>
{/snippet}

<style>
	.combobox__chips {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-3);
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
	}
	.combobox__chip-wrap {
		display: inline-flex;
		-webkit-user-select: none;
		user-select: none;
	}
	.combobox__chips :global(.chip:not([data-disabled]):hover) {
		transform: none;
	}
	.combobox__chips[data-placeholder] .combobox__filter {
		min-width: 8rem;
	}
	.combobox__filter {
		flex: 1 1 3rem;
		min-width: 3rem;
		padding: var(--space-1) 0;
		border: 0;
		outline: none;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--fs-md);
	}
	@media (pointer: coarse) {
		.combobox__filter {
			font-size: max(16px, 1em);
		}
	}

	.combobox__caret {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		-webkit-user-select: none;
		user-select: none;
		transition: transform 140ms var(--ease-standard);
	}
	.combobox__caret[data-state='open'] {
		transform: rotate(180deg);
	}
</style>
