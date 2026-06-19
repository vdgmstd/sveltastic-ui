<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputFieldProps = WithElementRef<
		{
			/** Eye-toggle button when `type === 'password'`. */
			passwordReveal?: boolean;
			/** Accessible name when no visible label is rendered. */
			ariaLabel?: string;
			/** Accessible label for the password reveal button while the value is hidden. */
			showPasswordLabel?: string;
			/** Accessible label for the password reveal button while the value is shown. */
			hidePasswordLabel?: string;
			/** Render-delegation (bits-ui v2 `child`): replaces the native `<input>` with your own control. Receives the merged field props (id, `data-*`, `aria-*`, handlers, ref) to spread. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLInputAttributes, 'value' | 'children'>,
		HTMLInputElement
	>;
</script>

<script lang="ts">
	import { EyeIcon, EyeSlashIcon } from 'phosphor-svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mask as maskAction } from '../../actions/mask';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { cn } from '../../utils/cn';
	import { useInputCtx } from './context';

	let {
		passwordReveal = false,
		ariaLabel,
		showPasswordLabel = 'Show password',
		hidePasswordLabel = 'Hide password',
		child,
		ref = $bindable(null),
		type = 'text',
		placeholder,
		oninput,
		onfocus,
		onmousedown,
		class: className,
		...rest
	}: InputFieldProps = $props();

	const ctx = useInputCtx();

	let isPassword = $derived(type === 'password');
	let isPasswordRevealed = $state(false);
	let resolvedType = $derived(isPassword && passwordReveal && isPasswordRevealed ? 'text' : type);

	// Fake placeholder — the kit's animated placeholder; native is blanked. Non-floating modes (default/inline) show it.
	let showFakePlaceholder = $derived(
		!!placeholder && ctx.labelStyle !== 'placeholder' && !ctx.maskTemplate
	);

	$effect(() => ctx.syncMask());

	$effect(() => {
		ctx.hasValue = ctx.value !== '';
	});

	$effect(() => () => ctx.disposeMask());

	function togglePassword(): void {
		isPasswordRevealed = !isPasswordRevealed;
	}

	function handleMouseDown(event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }): void {
		ctx.markPointerDown();
		onmousedown?.(event);
	}

	function handleFocus(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }): void {
		onfocus?.(event);
		ctx.repositionCaretOnFocus(event.currentTarget);
	}

	const refKey = createAttachmentKey();

	const fieldProps = $derived(
		mergeProps(rest, {
			class: cn('input__el', className),
			id: ctx.id,
			type: resolvedType,
			placeholder: '',
			disabled: ctx.disabled,
			readonly: ctx.readonly,
			'aria-label': ariaLabel,
			'aria-invalid': ctx.fieldState === 'danger' ? true : undefined,
			'aria-describedby': ctx.hasMessage ? ctx.messageId : undefined,
			'data-state': dataState(ctx.focusedActive ? 'focused' : undefined),
			'data-disabled': boolAttr(ctx.disabled),
			'data-field-state': dataState(ctx.fieldState !== 'default' ? ctx.fieldState : undefined),
			onfocus: handleFocus,
			onmousedown: handleMouseDown,
			...(oninput ? { oninput } : {}),
			[refKey]: attachRef<HTMLInputElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: fieldProps })}
{:else}
	<input
		bind:value={() => ctx.value, (v) => ctx.setValue(v)}
		use:maskAction={ctx.resolvedMask}
		{...fieldProps}
	/>
	{#if showFakePlaceholder}
		<span class="input__label" aria-hidden="true">{placeholder}</span>
	{/if}
	{#if ctx.showMask}
		<span class="input__mask" aria-hidden="true"
			><span class="input__mask-typed">{ctx.maskedValue.slice(0, ctx.typedLen)}</span><span
				class="input__mask-rest">{ctx.maskRemainder}</span
			></span
		>
	{/if}
	{#if isPassword && passwordReveal}
		<button
			type="button"
			class="input__reveal"
			onclick={togglePassword}
			aria-label={isPasswordRevealed ? hidePasswordLabel : showPasswordLabel}
		>
			{#if isPasswordRevealed}
				<EyeSlashIcon size={18} weight="regular" />
			{:else}
				<EyeIcon size={18} weight="regular" />
			{/if}
		</button>
	{/if}
{/if}
