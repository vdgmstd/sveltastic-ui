<script lang="ts" module>
	import '../../styles/field.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type { MaskOptions } from '../../actions/mask';
	import type { TextareaVariant, TextareaLabelStyle, TextareaState } from './textarea.svelte';

	export type { TextareaVariant, TextareaLabelStyle, TextareaState };

	export type TextareaRootProps = WithElementRef<
		{
			/** Bound text value. */
			value?: string;
			/** Visual variant. */
			variant?: TextareaVariant;
			/** Label placement / behaviour. */
			labelStyle?: TextareaLabelStyle;
			/** Stretch to container. */
			block?: boolean;
			/** Tints background / label. Named `fieldState` to avoid colliding with the `$state` rune. */
			fieldState?: TextareaState;
			/** Auto-grow height with content. */
			autoGrow?: boolean;
			/** Drop background. */
			transparent?: boolean;
			/** Custom palette accent. */
			color?: Color;
			/** Mask pattern — string, alternatives array, or full maska options. Tokens: `#` digit, `@` letter, `*` alphanumeric. */
			mask?: MaskOptions;
			/** Disabled state, flows to the field. */
			disabled?: boolean;
			/** Read-only state, flows to the field. */
			readonly?: boolean;
			/** Default content — place `Textarea.Field`, `Textarea.Label`, `Textarea.Message`. */
			children?: Snippet;
			/** Render-delegation (bits-ui v2 `child`): replaces the styled column wrapper with your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires with the new value on every edit (kit controlled-state idiom). */
			onValueChange?: (value: string) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'color'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { setTextareaCtx } from './context';
	import { TextareaRootState } from './textarea.svelte';

	let {
		value = $bindable(''),
		variant = 'default',
		labelStyle = 'default',
		block = false,
		fieldState = 'default',
		autoGrow = false,
		transparent = false,
		color,
		mask,
		disabled = false,
		readonly = false,
		children,
		child,
		onValueChange,
		ref = $bindable(null),
		id: idProp,
		class: className,
		style: userStyle,
		...rest
	}: TextareaRootProps = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);

	const root = setTextareaCtx(
		new TextareaRootState({
			getValue: () => value ?? '',
			setValueProp: (v) => (value = v),
			getOnValueChange: () => onValueChange,
			getVariant: () => variant,
			getLabelStyle: () => labelStyle,
			getShape: () => 'default',
			getBlock: () => block,
			getIconPosition: () => 'before',
			getFieldState: () => fieldState,
			getColor: () => color,
			getIconColor: () => undefined,
			getLoading: () => false,
			getProgress: () => 0,
			getTransparent: () => transparent,
			getForceFocus: () => false,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getMask: () => mask,
			getId: () => id,
			getAutoGrow: () => autoGrow
		})
	);

	$effect(() => root.sync());

	const refKey = createAttachmentKey();
	// Mint once: the style string reads tweens that change every frame, so an inline attachment would re-run per frame.
	const refAttach = attachRef<HTMLDivElement>((n) => (ref = n));
	const merged = $derived(
		mergeProps(rest, {
			class: cn(
				'textarea',
				block && 'textarea--block',
				root.isFloating && 'textarea--label-placeholder',
				variant === 'border' && 'textarea--variant-border',
				variant === 'shadow' && 'textarea--variant-shadow',
				transparent && 'textarea--transparent',
				autoGrow && 'textarea--autogrow',
				root.focusedActive && 'textarea--focused',
				root.isStateVariant && 'textarea--state',
				fieldState === 'primary' && 'textarea--state-primary',
				fieldState === 'success' && 'textarea--state-success',
				fieldState === 'danger' && 'textarea--state-danger',
				fieldState === 'warning' && 'textarea--state-warn',
				fieldState === 'dark' && 'textarea--state-dark',
				className
			),
			style:
				`--c:${root.triplet};` +
				`--lh:${root.lhTween.current};` +
				`--fp:${root.fpTween.current};` +
				`--vp:${root.vpTween.current};` +
				(userStyle ?? ''),
			'data-state': dataState(root.focusedActive ? 'focused' : undefined),
			'data-disabled': boolAttr(disabled),
			'data-readonly': boolAttr(readonly),
			'data-field-state': dataState(fieldState !== 'default' ? fieldState : undefined),
			'data-variant': variant,
			'data-label-style': labelStyle,
			'data-testid': 'textarea',
			[refKey]: refAttach
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
