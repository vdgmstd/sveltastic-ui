<script lang="ts" module>
	import '../../styles/field.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, WithElementRef } from '../../types';
	import type { MaskOptions } from '../../actions/mask';
	import type { InputVariant, InputLabelStyle, InputState } from './input.svelte';

	export type { InputVariant, InputLabelStyle, InputState };

	export type InputRootProps = WithElementRef<
		{
			/** Bound input value (strings only — for numbers/dates use `bind:value` and let `type` coerce). */
			value?: string;
			/** Visual style. */
			variant?: InputVariant;
			/** Label placement / behaviour. */
			labelStyle?: InputLabelStyle;
			/** Shape of the field — only `'square'` (radius 0) differs from the default. */
			shape?: Shape;
			/** Stretch to container. */
			block?: boolean;
			/** Icon side. */
			iconPosition?: 'before' | 'after';
			/** Spinner overlay. */
			loading?: boolean;
			/** Tints background / label / icon. Named `fieldState` to avoid colliding with the `$state` rune. */
			fieldState?: InputState;
			/** 0..100 progress bar at the bottom. */
			progress?: number;
			/** Drop background. */
			transparent?: boolean;
			/** Custom palette color. */
			color?: Color;
			/** When set, the icon background fills with this color on focus (and the glyph turns white). When unset, only the glyph color changes on focus. */
			iconColor?: Color;
			/** Mask pattern — string (e.g. `'###-###'`), alternatives array, or full maska options. Tokens: `#` digit, `@` letter, `*` alphanumeric. */
			mask?: MaskOptions;
			/**
			 * External force-focused override. When `true`, the field renders as if focused (icon lifts, ripple fills,
			 * label floats) regardless of real DOM focus. For composite controls (Select / DateTimePicker) that own
			 * their own activation state and need the trigger to look active while a popover is open.
			 */
			forceFocus?: boolean;
			/** Disabled state, flows to the field. */
			disabled?: boolean;
			/** Read-only state, flows to the field. */
			readonly?: boolean;
			/** Default content — place `Input.Field`, `Input.Icon`, `Input.Label`, `Input.Message`. */
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
	import { setInputCtx } from './context';
	import { InputRootState } from './input.svelte';

	let {
		value = $bindable(''),
		variant = 'default',
		labelStyle = 'default',
		shape = 'default',
		block = false,
		iconPosition = 'before',
		loading = false,
		fieldState = 'default',
		progress = 0,
		transparent = false,
		color,
		iconColor,
		mask,
		forceFocus = false,
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
	}: InputRootProps = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);

	const root = setInputCtx(
		new InputRootState({
			getValue: () => value ?? '',
			setValueProp: (v) => (value = v),
			getOnValueChange: () => onValueChange,
			getVariant: () => variant,
			getLabelStyle: () => labelStyle,
			getShape: () => shape,
			getBlock: () => block,
			getIconPosition: () => iconPosition,
			getFieldState: () => fieldState,
			getColor: () => color,
			getIconColor: () => iconColor,
			getLoading: () => loading,
			getProgress: () => progress,
			getTransparent: () => transparent,
			getForceFocus: () => forceFocus,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getMask: () => mask,
			getId: () => id
		})
	);

	$effect(() => root.sync());

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn(
				'input',
				block && 'input--block',
				root.isFloating && 'input--label-placeholder',
				variant === 'border' && 'input--variant-border',
				variant === 'shadow' && 'input--variant-shadow',
				transparent && 'input--transparent',
				shape === 'square' && 'input--shape-square',
				root.isPlainSurface && 'input--plain',
				root.isIconFillBg && 'input--icon-fill-bg',
				root.focusedActive && 'input--focused',
				root.isStateVariant && 'input--state',
				fieldState === 'primary' && 'input--state-primary',
				fieldState === 'success' && 'input--state-success',
				fieldState === 'danger' && 'input--state-danger',
				fieldState === 'warning' && 'input--state-warn',
				fieldState === 'dark' && 'input--state-dark',
				className
			),
			style:
				`--c:${root.triplet};` +
				(root.iconTriplet ? `--icon-c:${root.iconTriplet};` : '') +
				`--lh:${root.lhTween.current};` +
				`--fp:${root.fpTween.current};` +
				`--vp:${root.vpTween.current};` +
				`--pp:${root.progressTween.current}%;` +
				`--mask-len:${root.maskTemplate.length};` +
				(userStyle ?? ''),
			'data-state': dataState(root.focusedActive ? 'focused' : undefined),
			'data-disabled': boolAttr(disabled),
			'data-readonly': boolAttr(readonly),
			'data-field-state': dataState(fieldState !== 'default' ? fieldState : undefined),
			'data-variant': variant,
			'data-loading': boolAttr(loading),
			'data-testid': 'input',
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{@render children?.()}
		{#if root.progressKind}
			<div class="input__progress input__progress--{root.progressKind}">
				<div class="input__progress-bar" style:width="var(--pp)"></div>
			</div>
		{/if}
	</div>
{/if}
