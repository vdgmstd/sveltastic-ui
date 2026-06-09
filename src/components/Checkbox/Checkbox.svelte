<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';

	export type CheckboxRootProps<V = unknown> = WithElementRef<
		{
			/** Boolean checked state. Use `bind:checked` for two-way control. Mutually exclusive with a group `value`. */
			checked?: boolean;
			/** The membership token contributed to an enclosing `<Checkbox.Group>`. */
			value?: V;
			/** Third-state visual; renders a minus glyph instead of the check. Use `bind:indeterminate`. */
			indeterminate?: boolean;
			/** Strike through the label when checked. */
			lineThrough?: boolean;
			/** Spinner overlay; blocks interaction. */
			loading?: boolean;
			/** Inert checkbox (falls back to the group `disabled`). */
			disabled?: boolean;
			/** Mark the control as required (sets `aria-required` and the native attribute). */
			required?: boolean;
			/** Label placement relative to the box. */
			labelPosition?: 'before' | 'after';
			/** Palette name or hex / rgb. */
			color?: Color;
			/** Accessible name when no visible `<Checkbox.Label>` is rendered. */
			ariaLabel?: string;
			/** Native `name` for form submission (falls back to the group `name`). */
			name?: string;
			/** Composition: `<Checkbox.Indicator>` + optional `<Checkbox.Label>`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own label element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires with the next checked state on change. */
			onCheckedChange?: (checked: boolean) => void;
			/** Fires with the next indeterminate state when it clears on toggle. */
			onIndeterminateChange?: (indeterminate: boolean) => void;
		} & Omit<HTMLLabelAttributes, 'children' | 'color'>,
		HTMLLabelElement
	>;
</script>

<script lang="ts" generics="V">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { reducedMotion } from '../../state/reducedMotion.svelte';
	import { pressBounce } from '../../actions/pressBounce.svelte';
	import { useCheckboxGroupContext, setCheckboxRootContext } from './context';
	import { CheckboxRootState } from './checkbox.svelte';

	let {
		checked = $bindable(false),
		value,
		indeterminate = $bindable(false),
		lineThrough = false,
		loading = false,
		required,
		labelPosition = 'after',
		color,
		ariaLabel,
		name,
		children,
		child,
		onCheckedChange,
		onIndeterminateChange,
		ref = $bindable(null),
		id: idProp,
		disabled,
		class: className,
		style: userStyle,
		...rest
	}: CheckboxRootProps<V> = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);

	const groupCtx = useCheckboxGroupContext();
	const token = $derived(value === undefined ? undefined : String(value));

	const state = setCheckboxRootContext(
		new CheckboxRootState(
			{
				getId: () => id,
				getChecked: () => checked,
				setCheckedProp: (v) => (checked = v),
				onCheckedChange: () => onCheckedChange,
				getIndeterminate: () => indeterminate,
				setIndeterminateProp: (v) => (indeterminate = v),
				onIndeterminateChange: () => onIndeterminateChange,
				getToken: () => token,
				getColor: () => color,
				getDisabled: () => disabled,
				getRequired: () => required,
				getLoading: () => loading,
				getName: () => name
			},
			groupCtx
		)
	);

	let triplet = $derived(rgbTriplet(state.color));
	let isChecked = $derived(state.isChecked);
	let lineTarget = $derived(lineThrough && isChecked ? 1 : 0);

	$effect(() => reducedMotion.subscribe());

	const press = pressBounce({
		disabled: () => state.disabled || loading,
		onstart: () => (state.pressColor = !isChecked),
		onsettle: () => (state.pressColor = false),
		keys: [' ']
	});

	const fillTween = new Tween(untrack(() => state.fillTarget), { duration: 260, easing: cubicOut });
	const drawTween = new Tween(untrack(() => state.drawTarget), { duration: 320, easing: cubicOut });
	const minusTween = new Tween(untrack(() => state.minusTarget), { duration: 220, easing: cubicOut });
	const lineTween = new Tween(untrack(() => lineTarget), { duration: 260, easing: cubicOut });
	$effect(() => {
		const next = state.fillTarget;
		const duration = reducedMotion.current ? 0 : 260;
		fillTween.set(next, {
			duration,
			easing: cubicOut,
			delay: next === 1 && state.pressColor && !reducedMotion.current ? 50 : 0
		});
	});
	$effect(() => {
		const next = state.drawTarget;
		drawTween.set(next, {
			duration: reducedMotion.current ? 0 : next === 1 ? 460 : 220,
			easing: cubicOut,
			delay: next === 1 && state.pressColor && !reducedMotion.current ? 130 : 0
		});
	});
	$effect(() => {
		minusTween.set(state.minusTarget, { duration: reducedMotion.current ? 0 : 220, easing: cubicOut });
	});
	$effect(() => {
		lineTween.set(lineTarget, { duration: reducedMotion.current ? 0 : 260, easing: cubicOut });
	});

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: 'checkbox',
		for: id,
		'data-testid': 'checkbox',
		'data-state': dataState(
			indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'
		),
		'data-checked': boolAttr(isChecked),
		'data-disabled': boolAttr(state.disabled),
		'data-loading': boolAttr(loading),
		'data-indeterminate': boolAttr(indeterminate),
		'data-pressing': boolAttr(state.pressColor),
		'data-label-before': boolAttr(labelPosition === 'before'),
		'data-show-glyph': boolAttr(state.showGlyph),
		'data-has-icon': boolAttr(state.hasCustomIcon),
		'aria-label': ariaLabel,
		onpointerdown: press.onpointerdown,
		onkeydown: press.onkeydown
	});
	const styleVars = $derived(
		`--c:${triplet};` +
			`--fp:${fillTween.current};` +
			`--dp:${drawTween.current};` +
			`--mp:${minusTween.current};` +
			`--lt:${lineTween.current};` +
			`--ps:${press.scale};` +
			(userStyle ?? '')
	);
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			style: styleVars,
			[refKey]: attachRef<HTMLLabelElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<label {...merged}>
		{@render children?.()}
	</label>
{/if}

<style>
	:where(.checkbox) {
		--c: var(--primary);
		--fp: 0;
		--dp: 0;
		--mp: 0;
		--lt: 0;
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--fs-md);
		-webkit-user-select: none;
		user-select: none;
	}
	:where(.checkbox[data-disabled]) {
		pointer-events: none;
	}
	:where(.checkbox[data-loading]) {
		pointer-events: none;
	}
</style>
