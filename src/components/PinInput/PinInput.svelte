<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type { PinInputCell as PinInputCellData, PinInputType } from './context';

	export type PinInputRootProps = WithElementRef<
		{
			/** Bound value (the concatenated characters). Two-way bindable. */
			value?: string;
			/** Accent palette for the active-cell ring (→ --c). */
			color?: Color;
			/** Error state — flags the cells red (→ data-invalid). */
			invalid?: boolean;
			/** Fired on every value change. */
			onValueChange?: (value: string) => void;
			/** Fired once the value fills every cell (length === maxLength). */
			onComplete?: (value: string) => void;
			/** Number of cells. */
			maxLength?: number;
			/** Allowed-character preset (also sets inputmode). */
			type?: PinInputType;
			/** Custom per-character allow test; overrides `type`. */
			pattern?: RegExp;
			/** Sanitize pasted text before it is filtered + applied. */
			pasteTransformer?: (text: string) => string;
			/** Inert + dimmed. */
			disabled?: boolean;
			/** Form field name on the hidden input. */
			name?: string;
			/** Id for the hidden input. */
			inputId?: string;
			/** Bindable ref to the hidden input (the real control). */
			inputRef?: HTMLInputElement | null;
			/** Class merged onto the root wrapper. */
			class?: string;
			/** Inline style merged onto the root wrapper. */
			style?: string;
			/** Slot loop — receives `{ cells }`; render a `PinInput.Cell` per cell. Omit for the default cells. */
			children?: Snippet<[{ cells: PinInputCellData[] }]>;
		} & Omit<
			HTMLInputAttributes,
			'value' | 'type' | 'pattern' | 'name' | 'disabled' | 'maxlength' | 'children' | 'class' | 'style'
		>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { rgbTriplet } from '../../utils/color';
	import { attachRef } from '../../utils/ref';
	import { setPinInputCtx } from './context';
	import { PinInputRootState } from './pinInputState.svelte';
	import PinInputCell from './PinInputCell.svelte';

	let {
		value = $bindable(''),
		color = 'primary',
		invalid = false,
		onValueChange,
		onComplete,
		maxLength = 6,
		type = 'numeric',
		pattern,
		pasteTransformer,
		disabled = false,
		name,
		inputId,
		inputRef = $bindable(null),
		ref = $bindable(null),
		children,
		class: className,
		style: userStyle,
		...rest
	}: PinInputRootProps = $props();

	let triplet = $derived(rgbTriplet(color));

	const root = setPinInputCtx(
		new PinInputRootState({
			getValue: () => value ?? '',
			setValueProp: (v) => (value = v),
			onValueChange: () => onValueChange,
			onComplete: () => onComplete,
			maxLength: () => maxLength,
			type: () => type,
			pattern: () => pattern,
			pasteTransformer: () => pasteTransformer,
			disabled: () => disabled
		})
	);

	const refKey = createAttachmentKey();
	const refAttach = attachRef<HTMLDivElement>((n) => (ref = n));

	const inputAttach = (node: Element) => {
		const el = node as HTMLInputElement;
		inputRef = el;
		root.setInput(el);
		return () => {
			inputRef = null;
			root.setInput(null);
		};
	};

	const rootProps = $derived({
		class: cn('pin-input', className),
		style: `--c:${triplet};${userStyle ?? ''}`,
		'data-pin-input-root': '',
		'data-disabled': boolAttr(disabled),
		'data-invalid': boolAttr(invalid),
		[refKey]: refAttach
	});
</script>

<div {...rootProps}>
	<input
		{...rest}
		class="pin-input__field"
		type="text"
		inputmode={root.inputMode}
		autocomplete="one-time-code"
		autocapitalize="none"
		autocorrect="off"
		spellcheck="false"
		{value}
		{name}
		{disabled}
		id={inputId}
		maxlength={maxLength}
		oninput={(e) => root.handleInput(e)}
		onpaste={(e) => root.handlePaste(e)}
		onfocus={() => root.handleFocus()}
		onblur={() => root.handleBlur()}
		{@attach inputAttach}
	/>
	{#if children}
		{@render children({ cells: root.cells })}
	{:else}
		{#each root.cells as cell, i (i)}
			<PinInputCell {cell} />
		{/each}
	{/if}
</div>

<style>
	.pin-input {
		position: relative;
		display: inline-flex;
		gap: var(--space-2);
	}
	/* The real control: overlays the cells, fully interactive but visually invisible (cells draw the chars + caret). */
	.pin-input__field {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: transparent;
		caret-color: transparent;
		outline: none;
		font: inherit;
		text-align: center;
		cursor: text;
		z-index: 1;
	}
	.pin-input__field:disabled {
		cursor: not-allowed;
	}
	.pin-input__field::selection {
		background: transparent;
	}
</style>
