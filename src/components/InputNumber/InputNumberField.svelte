<script lang="ts" module>
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputNumberFieldProps = WithElementRef<
		{
			/** Accessible name for the spinbutton field. Required when no visible label is associated via `labelId`. */
			ariaLabel?: string;
			/** Id of an external visible label element, wired to the field via `aria-labelledby`. */
			labelId?: string;
		} & Omit<
			HTMLInputAttributes,
			'value' | 'type' | 'role' | 'disabled' | 'readonly' | 'oninput' | 'onkeydown' | 'onfocus' | 'onblur'
		>,
		HTMLInputElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { surfaceRipple } from '../../actions/surfaceRipple.svelte';
	import { useInputNumberContext } from './context';

	let {
		ref = $bindable(null),
		ariaLabel,
		labelId,
		class: className,
		...rest
	}: InputNumberFieldProps = $props();

	const root = useInputNumberContext();

	const refKey = createAttachmentKey();
	// Mint once: `merged` recomputes every frame the digits roll (reads root.displayedText), re-running an inline attachment.
	const refAttach = attachRef<HTMLInputElement>((n) => (ref = n));
	const merged = $derived(
		mergeProps(
			rest,
			{
				id: root.fieldId,
				class: 'input-number__input',
				type: 'text' as const,
				inputmode: 'decimal' as const,
				autocomplete: 'off' as const,
				autocorrect: 'off',
				spellcheck: false,
				role: 'spinbutton' as const,
				'aria-label': ariaLabel,
				'aria-labelledby': labelId,
				'aria-valuenow': root.value,
				'aria-valuemin': root.ariaValueMin,
				'aria-valuemax': root.ariaValueMax,
				'aria-valuetext': root.displayedText,
				value: root.displayedText,
				disabled: root.disabled,
				readonly: root.readonly,
				oninput: (e: Event & { currentTarget: EventTarget & HTMLInputElement }) =>
					root.handleInput(e),
				onkeydown: (e: KeyboardEvent) => root.handleKeydown(e),
				onfocus: () => root.handleFocus(),
				onblur: () => root.handleBlur()
			},
			{
				class: className,
				[refKey]: refAttach
			}
		)
	);
</script>

<div class="input-number__field" use:surfaceRipple={{ mode: 'focus', disabled: root.isInert }}>
	<input {...merged} />
</div>
