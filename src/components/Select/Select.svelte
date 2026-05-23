<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, ColorName } from '../../types';
	import type { InputState, InputLabelStyle, InputVariant } from '../Input/Input.svelte';
	import type { PopoverOpenAnim } from '../../primitives/Popover.svelte';

	export type SelectItem<V = unknown> = {
		/** Stored when this row is picked. */
		value: V;
		/** Visible label. */
		label: string;
		/** Inert row, can't be picked. */
		disabled?: boolean;
	};

	export type SelectGroup<V = unknown> = {
		/** Section heading. */
		title: string;
		/** Items under this heading. */
		items: ReadonlyArray<SelectItem<V>>;
	};

	export type SelectItems<V = unknown> = ReadonlyArray<SelectItem<V> | SelectGroup<V>>;

	export type SelectOpenAnim = PopoverOpenAnim | 'stagger';

	export type SelectFieldContext<V = unknown> = {
		/** Whether the popover is open. */
		open: boolean;
		/** Resolved label of the current selection (single mode) or `''` (multi). */
		displayLabel: string;
		/** Current filter text. */
		filterText: string;
		/** Update the filter text from a custom input. */
		setFilterText: (text: string) => void;
		/** Resolved chips for multi mode. Empty in single mode. */
		chipItems: SelectItem<V>[];
		/** Remove a chip by value. */
		removeChip: (v: V) => void;
	};

	export type SelectProps<V = unknown> = {
		/** Bound selection. Scalar in single mode, array in `multiple`. */
		value?: V | V[];
		/** Items to render. Mix flat items and grouped sections freely. */
		items?: SelectItems<V>;
		/** Multiple selection. */
		multiple?: boolean;
		/** Inline text filter. */
		filter?: boolean;
		/** Disabled. */
		disabled?: boolean;
		/** Spinner indicator (visual only). */
		loading?: boolean;
		/** State color tint (matches Input). */
		fieldState?: InputState;
		/** Visual style. Mirrors Input. */
		variant?: InputVariant;
		/** Stretch to container width. */
		block?: boolean;
		/** Collapse multi-chips after the first to a "+N" pill. */
		collapseChips?: boolean;
		/** Dropdown panel open/close animation. */
		openAnim?: SelectOpenAnim;
		/** Label / placeholder behaviour. */
		labelStyle?: InputLabelStyle;
		/** Static label. */
		label?: string;
		/** Placeholder text. */
		placeholder?: string;
		/** Palette color. */
		color?: Color;
		/** Empty-state content (overrides default tray + "No data"). */
		notData?: Snippet;
		/** Custom indicator icon (replaces the default chevron). Receives `isOpen`. */
		caret?: Snippet<[boolean]>;
		/** Custom row renderer. Receives the item and whether it's selected. */
		option?: Snippet<[SelectItem<V>, boolean]>;
		/** Custom group-title renderer. Receives the section title. */
		groupTitle?: Snippet<[string]>;
		/** Custom renderer for the selected value inside the trigger field (single mode only). */
		selected?: Snippet<[SelectItem<V>]>;
		/** Custom renderer for chips in `multiple` mode. */
		chip?: Snippet<[SelectItem<V>, () => void]>;
		/**
		 * Full trigger-field override. When provided, replaces the entire `<Input>`-based field —
		 * consumer renders whatever markup they want. Receives the selection / filter / chip context.
		 */
		field?: Snippet<[SelectFieldContext<V>]>;
		/** Feedback message under the field. */
		message?: Snippet;
		/** Fires when the selection changes. */
		onchange?: (value: V | V[] | undefined) => void;
		/** Class merged onto the root wrapper. */
		class?: string;
		/** Inline style merged onto the root wrapper. */
		style?: string;
	};
</script>

<script lang="ts" generics="V">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fly, scale } from 'svelte/transition';
	import { CaretDownIcon, TrayIcon } from 'phosphor-svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import Input from '../Input/Input.svelte';
	import Chip from '../Chip/Chip.svelte';
	import Popover from '../../primitives/Popover.svelte';
	import MenuItem from '../../primitives/MenuItem.svelte';
	import MenuLabel from '../../primitives/MenuLabel.svelte';

	let {
		value = $bindable(),
		items = [],
		multiple = false,
		filter = false,
		disabled = false,
		loading = false,
		fieldState = 'default',
		variant = 'default',
		block = false,
		collapseChips = false,
		labelStyle = 'default',
		label,
		placeholder = '',
		color = 'primary',
		openAnim = 'pop',
		notData,
		caret,
		option,
		groupTitle,
		selected: selectedSnippet,
		chip: chipSnippet,
		field,
		message,
		onchange,
		class: className,
		style: userStyle
	}: SelectProps<V> = $props();

	const id = nextId('select');
	let resolvedColor = $derived<Color>(
		fieldState === 'default' ? color : (fieldState as ColorName)
	);
	let triplet = $derived(rgbTriplet(resolvedColor));
	let isOpen = $state(false);
	let filterText = $state('');

	let panelAnim = $derived<PopoverOpenAnim>(openAnim === 'stagger' ? 'slide' : openAnim);
	let isStagger = $derived(openAnim === 'stagger');

	let caretTarget = $derived(isOpen ? 1 : 0);
	const caretTween = new Tween(untrack(() => caretTarget), { duration: 140, easing: cubicOut });
	$effect(() => { caretTween.target = caretTarget; });

	function isGroup(it: SelectItem<V> | SelectGroup<V>): it is SelectGroup<V> {
		return 'items' in it && Array.isArray(it.items);
	}

	let flatItems = $derived.by<SelectItem<V>[]>(() => {
		const out: SelectItem<V>[] = [];
		for (const it of items) {
			if (isGroup(it)) for (const sub of it.items) out.push(sub);
			else out.push(it);
		}
		return out;
	});

	let renderSections = $derived.by<{ title?: string; items: SelectItem<V>[] }[]>(() => {
		const q = filterText.trim().toLowerCase();
		const matches = (lbl: string) => !q || lbl.toLowerCase().includes(q);
		const result: { title?: string; items: SelectItem<V>[] }[] = [];
		let buffer: SelectItem<V>[] = [];
		const flush = () => {
			if (buffer.length) result.push({ items: buffer });
			buffer = [];
		};
		for (const it of items) {
			if (isGroup(it)) {
				flush();
				const matched = it.items.filter((s) => matches(s.label));
				if (matched.length) result.push({ title: it.title, items: [...matched] });
			} else if (matches(it.label)) {
				buffer.push(it);
			}
		}
		flush();
		return result;
	});

	function isSelected(v: V): boolean {
		if (multiple) return Array.isArray(value) && value.includes(v);
		return value === v;
	}

	let chipItems = $derived.by<SelectItem<V>[]>(() => {
		if (!multiple || !Array.isArray(value)) return [];
		const lookup = new Map<V, SelectItem<V>>();
		for (const it of flatItems) lookup.set(it.value, it);
		return value.map((v) => lookup.get(v) ?? ({ value: v, label: String(v) } as SelectItem<V>));
	});

	let selectedItem = $derived.by<SelectItem<V> | undefined>(() => {
		if (multiple) return undefined;
		return flatItems.find((i) => i.value === value);
	});

	let displayLabel = $derived.by<string>(() => {
		if (multiple) return '';
		if (selectedItem) return selectedItem.label;
		return value == null ? '' : String(value);
	});

	let inputValue = $derived.by<string>(() => {
		if (multiple) return '';
		if (filter && isOpen) return filterText;
		return displayLabel;
	});

	function pick(item: SelectItem<V>): void {
		if (item.disabled) return;
		if (multiple) {
			const arr = Array.isArray(value) ? [...value] : [];
			const idx = arr.indexOf(item.value);
			if (idx === -1) arr.push(item.value);
			else arr.splice(idx, 1);
			value = arr;
			onchange?.(arr);
		} else {
			value = item.value;
			onchange?.(item.value);
		}
		filterText = '';
	}

	function removeChip(v: V): void {
		if (!Array.isArray(value)) return;
		value = value.filter((x) => x !== v);
		onchange?.(value);
	}

	function setFilterText(text: string): void {
		filterText = text;
	}

	function handleOpenChange(next: boolean): void {
		if (!next) filterText = '';
	}

	function handleInputInput(e: Event): void {
		if (!filter) return;
		filterText = (e.currentTarget as HTMLInputElement).value;
	}

	function handleInputClick(e: MouseEvent): void {
		if (filter && isOpen) e.stopPropagation();
	}

	let fieldCtx = $derived<SelectFieldContext<V>>({
		open: isOpen,
		displayLabel,
		filterText,
		setFilterText,
		chipItems,
		removeChip
	});

	let usesInputField = $derived(multiple || (!!selectedSnippet && !!selectedItem));
</script>

<div
	class={cn('select-wrap', block && 'select-wrap--block', className)}
	style:--c={triplet}
	style={userStyle}
	data-testid="select"
>
	{#if label && labelStyle === 'inline'}
		<label class="select__label-block" for={id}>{label}</label>
	{/if}

	<Popover
		bind:open={isOpen}
		placement="bottom-start"
		openAnim={panelAnim}
		matchWidth
		popupRole="listbox"
		triggerRole="combobox"
		closeOnSelect={!multiple}
		autoFocus={false}
		{disabled}
		{block}
		onopenchange={handleOpenChange}
	>
		{#snippet trigger()}
			{#if field}
				{@render field(fieldCtx)}
			{:else}
				<Input
					value={inputValue}
					{color}
					iconColor={color}
					iconPosition="after"
					{variant}
					{fieldState}
					{block}
					{disabled}
					{label}
					{labelStyle}
					{placeholder}
					{loading}
					readonly={!filter}
					forceFocus={isOpen}
					{id}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck={false}
					aria-autocomplete="list"
					icon={caretIconSnippet}
					field={usesInputField ? selectInnerField : undefined}
					oninput={handleInputInput}
					onclick={handleInputClick}
				/>
			{/if}
		{/snippet}

		{#snippet children(close)}
			{#if flatItems.length === 0}
				<div class="select__empty">
					{#if notData}
						{@render notData()}
					{:else}
						<TrayIcon size={28} weight="duotone" />
						<span>No data</span>
					{/if}
				</div>
			{:else}
				{#each renderSections as section, i (section.title ?? `_${i}`)}
					{#if section.title}
						{#if groupTitle}
							{@render groupTitle(section.title)}
						{:else}
							<MenuLabel>{section.title}</MenuLabel>
						{/if}
					{/if}
					{#each section.items as item, j (item.value)}
						{#if option}
							<button
								type="button"
								class="select__custom-option"
								role="option"
								aria-selected={isSelected(item.value)}
								aria-disabled={item.disabled}
								tabindex="-1"
								onclick={() => {
									pick(item);
									if (!multiple) close();
								}}
								in:fly={isStagger ? { y: -6, duration: 220, delay: j * 26, easing: cubicOut } : { duration: 0 }}
							>
								{@render option(item, isSelected(item.value))}
							</button>
						{:else}
							<div
								in:fly={isStagger ? { y: -6, duration: 220, delay: j * 26, easing: cubicOut } : { duration: 0 }}
							>
								<MenuItem
									role="option"
									selected={isSelected(item.value)}
									disabled={item.disabled}
									onclick={() => {
										pick(item);
										if (!multiple) close();
									}}
								>
									{item.label}
								</MenuItem>
							</div>
						{/if}
					{/each}
				{/each}
			{/if}
		{/snippet}
	</Popover>

	{#if message}
		<div class="select__message" role={fieldState === 'danger' ? 'alert' : 'status'}>
			{@render message()}
		</div>
	{/if}
</div>

{#snippet caretIconSnippet()}
	<span class="select__caret" style:transform="rotate({caretTween.current * 180}deg)">
		{#if caret}
			{@render caret(isOpen)}
		{:else}
			<CaretDownIcon size={14} weight="bold" />
		{/if}
	</span>
{/snippet}

{#snippet selectInnerField()}
	{#if multiple}
		<div class="select__chips">
			{#each (collapseChips ? chipItems.slice(0, 1) : chipItems) as chip (chip.value)}
				{#if chipSnippet}
					<span
						in:scale={{ duration: 160, start: 0.7, opacity: 0 }}
						out:scale={{ duration: 140, start: 0.7, opacity: 0 }}
					>
						{@render chipSnippet(chip, () => removeChip(chip.value))}
					</span>
				{:else}
					<span
						class="select__chip-wrap"
						in:scale={{ duration: 160, start: 0.7, opacity: 0 }}
						out:scale={{ duration: 140, start: 0.7, opacity: 0 }}
					>
						<Chip
							color={resolvedColor}
							size="small"
							closable
							onclose={() => removeChip(chip.value)}
						>
							{chip.label}
						</Chip>
					</span>
				{/if}
			{/each}
			{#if collapseChips && chipItems.length > 1}
				<Chip color={resolvedColor} variant="flat" size="small">
					+{chipItems.length - 1}
				</Chip>
			{/if}
			{#if filter}
				<input
					class="select__filter"
					type="text"
					bind:value={filterText}
					placeholder={chipItems.length === 0 ? placeholder : ''}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					aria-autocomplete="list"
					onclick={(e) => { if (isOpen) e.stopPropagation(); }}
				/>
			{/if}
		</div>
	{:else if selectedSnippet && selectedItem && !(filter && isOpen)}
		<div class="select__selected">
			{@render selectedSnippet(selectedItem)}
		</div>
	{/if}
{/snippet}

<style>
	:where(.select-wrap) {
		--c: var(--primary);
		display: inline-flex;
		flex-direction: column;
		gap: 4px;
		position: relative;
		max-width: 100%;
	}
	:where(.select-wrap--block) { display: flex; width: 100%; }
	.select__label-block {
		font-size: 0.75rem;
		color: rgb(var(--text) / 0.7);
	}

	.select__caret {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.select__chips {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 5px;
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
	}
	.select__chip-wrap {
		display: inline-flex;
	}

	.select__filter {
		flex: 1 1 auto;
		min-width: 60px;
		padding: 2px 0;
		border: 0;
		outline: none;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 0.9rem;
	}
	@media (pointer: coarse) {
		.select__filter { font-size: max(16px, 1em); }
	}

	.select__selected {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: 2px 4px;
	}

	.select__custom-option {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		border-radius: 8px;
	}
	.select__custom-option:hover,
	.select__custom-option:focus-visible {
		background: rgb(var(--c) / 0.08);
		outline: none;
	}
	.select__custom-option[aria-disabled='true'] {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.select__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 18px 14px;
		font-size: 0.85rem;
		color: rgb(var(--text) / 0.5);
		text-align: center;
	}

	.select__message { font-size: 0.7rem; padding: 0 7px; color: rgb(var(--c)); }
</style>
