<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, WithElementRef } from '../../types';

	export type SwitchRootProps = WithElementRef<
		{
			/** Boolean state. Use `bind:checked` for two-way control. */
			checked?: boolean;
			/** Pill (`default` / `circle`) or square (`square`) track. */
			shape?: Shape;
			/** Visual size. */
			size?: Size;
			/** Centre the knob and lock interaction (renders as a mixed `checkbox`). */
			indeterminate?: boolean;
			/** Spinner overlay (collapses the track to a circle). */
			loading?: boolean;
			/** Icon-knob mode — drops the white pill so a `<Switch.Icon state="knob">` IS the knob. */
			ghostKnob?: boolean;
			/** Track + bg accent (only the swooping bg circle is tinted; knob always stays white). */
			color?: Color;
			/** Accessible name — required when no visible `<Switch.Label>` is associated with the control. */
			ariaLabel?: string;
			/** Composition: place `<Switch.Thumb>` + optional `<Switch.Icon>` parts here. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own track element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires with the next checked state on toggle. */
			onCheckedChange?: (checked: boolean) => void;
		} & Omit<HTMLInputAttributes, 'type' | 'checked' | 'children' | 'size' | 'onchange'>,
		HTMLInputElement
	>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import Spinner from '../../primitives/Spinner.svelte';
	import { setSwitchContext } from './context';
	import { SwitchRootState } from './switchState.svelte';

	let {
		checked = $bindable(false),
		shape = 'default',
		size = 'medium',
		indeterminate = false,
		loading = false,
		ghostKnob = false,
		color = 'primary',
		ariaLabel,
		children,
		child,
		onCheckedChange,
		ref = $bindable(null),
		id: idProp,
		disabled = false,
		class: className,
		style: userStyle,
		...rest
	}: SwitchRootProps = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);

	const root = setSwitchContext(
		new SwitchRootState({
			getId: () => id,
			getChecked: () => checked,
			setCheckedProp: (v) => (checked = v),
			onCheckedChange: () => onCheckedChange,
			getShape: () => shape,
			getSize: () => size,
			getColor: () => color,
			getDisabled: () => !!disabled,
			getLoading: () => loading,
			getIndeterminate: () => indeterminate,
			getGhostKnob: () => ghostKnob,
			getAriaLabel: () => ariaLabel
		})
	);

	// Spinner diameter tracks the height token (track collapses to a circle inset 2px each side).
	const SPINNER_BY_SIZE: Record<string, { size: number; thickness: number }> = {
		mini: { size: 14, thickness: 2.4 },
		small: { size: 18, thickness: 2.8 },
		medium: { size: 24, thickness: 3.2 },
		large: { size: 32, thickness: 3.6 },
		xl: { size: 40, thickness: 4 }
	};
	let spinner = $derived(SPINNER_BY_SIZE[size] ?? SPINNER_BY_SIZE.medium);

	function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
		if (root.isLocked) {
			event.currentTarget.checked = checked;
			return;
		}
		root.setChecked(event.currentTarget.checked);
	}

	const attrs = $derived({
		class: cn('switch', root.sizeModifier),
		...root.wrapperAttrs
	});
	const styleVars = $derived(
		`--c:${root.triplet};` +
			`--ps:${root.press.scale};` +
			(shape === 'square' ? '--track-radius:var(--rad-xs);--inner-radius:var(--rad-xs);' : '') +
			(userStyle ?? '')
	);
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			style: styleVars
		})
	);
</script>

{#snippet body()}
	<input
		{@attach attachRef<HTMLInputElement>((node) => (ref = node))}
		class="switch__input"
		{id}
		{...root.inputAttrs}
		onchange={handleChange}
	/>
	{@render children?.()}
	<div class="switch__background" aria-hidden="true"></div>
	{#if loading}
		<span class="switch__loading" aria-hidden="true">
			<Spinner {color} size={spinner.size} thickness={spinner.thickness} speed={800} />
		</span>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>
		{@render body()}
	</span>
{/if}

<style>
	:where(.switch) {
		--c: var(--primary);
		--track-w: 48px;
		--track-h: 28px;
		--knob-d: 20px;
		--knob-pad: 4px;
		--track-radius: var(--rad-xl);
		--inner-radius: var(--rad-circle);
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--track-w);
		height: var(--track-h);
		padding: var(--knob-pad);
		border: 0;
		border-radius: var(--track-radius);
		/* Slight bump from pure gray-2 so the small track reads against the page bg in both themes. */
		background: color-mix(in oklab, rgb(var(--gray-2)), rgb(var(--text)) 7%);
		color: rgb(255 255 255);
		cursor: pointer;
		overflow: hidden;
		box-sizing: border-box;
		transform: scale(var(--ps, 1));
		transform-origin: center;
		transition: background-color 0.25s;
	}
	.switch:hover:not([data-disabled]):not([data-loading]) {
		background: color-mix(in oklab, rgb(var(--gray-2)), rgb(var(--text)) 14%);
	}
	:where(.switch[data-disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}
	.switch:has(.switch__input:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	:where(.switch--size-mini) {
		--track-w: 30px;
		--track-h: 18px;
		--knob-d: 14px;
		--knob-pad: 2px;
		--track-radius: var(--rad-md);
	}
	:where(.switch--size-small) {
		--track-w: 38px;
		--track-h: 22px;
		--knob-d: 16px;
		--knob-pad: 3px;
		--track-radius: var(--rad-lg);
	}
	:where(.switch--size-large) {
		--track-w: 60px;
		--track-h: 36px;
		--knob-d: 26px;
		--knob-pad: 5px;
		--track-radius: var(--rad-2xl);
	}
	:where(.switch--size-xl) {
		--track-w: 72px;
		--track-h: 44px;
		--knob-d: 32px;
		--knob-pad: 6px;
		--track-radius: var(--rad-2xl);
	}

	.switch__input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		border-radius: inherit;
		cursor: pointer;
		opacity: 0;
		z-index: 100;
	}

	/* Background swoop: a track-wide circle that slides from left:-100% to left:0 when on. */
	.switch__background {
		position: absolute;
		left: -100%;
		width: 100%;
		height: auto;
		padding-bottom: 100%;
		background: rgb(var(--c));
		border-radius: var(--inner-radius);
		opacity: 0;
		transform: scale(1);
		transition: 0.25s ease-out;
		z-index: 2;
	}
	.switch[data-checked] .switch__background {
		opacity: 1;
		left: 0;
	}

	/* Loading — collapses track to a circle and shows the kit spinner overlay. */
	:where(.switch[data-loading]) {
		min-width: var(--track-h) !important;
		width: var(--track-h) !important;
		border-radius: var(--rad-circle) !important;
		pointer-events: none;
	}
	.switch[data-loading] .switch__background {
		opacity: 0 !important;
	}
	.switch__loading {
		position: absolute;
		inset: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 200;
	}
</style>
