<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CheckboxIndicatorProps = WithElementRef<
		{
			/** Optional `<Checkbox.Icon>` rendered as the checked glyph. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own box element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { rgbTriplet } from '../../utils/color';
	import Spinner from '../../primitives/Spinner.svelte';
	import { useCheckboxRootContext } from './context';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: CheckboxIndicatorProps = $props();

	const state = useCheckboxRootContext();

	function reflectIndeterminate(node: HTMLInputElement) {
		$effect(() => {
			node.indeterminate = state.indeterminate;
		});
	}

	function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
		if (state.disabled || state.loading || state.readonly) {
			event.currentTarget.checked = state.isChecked;
			return;
		}
		state.toggle(event.currentTarget.checked);
	}

	const SPINNER_SIZE = 20;
	const SPINNER_THICKNESS = 2.8;

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('checkbox__box', className),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#snippet body()}
	<input
		{@attach reflectIndeterminate}
		type="checkbox"
		class="checkbox__input"
		id={state.id}
		name={state.name}
		value={state.token ?? 'on'}
		checked={state.isChecked}
		disabled={state.disabled}
		required={state.required}
		aria-required={state.required ? 'true' : undefined}
		aria-checked={state.indeterminate ? 'mixed' : state.isChecked ? 'true' : 'false'}
		onchange={handleChange}
	/>
	<span class="checkbox__mask" aria-hidden="true">
		{@render children?.()}
		<span class="checkbox__glyph checkbox__glyph--draw">
			<svg viewBox="0 0 24 24" fill="none">
				<path
					d="M5 12 L10 17 L19 7"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
		<span class="checkbox__glyph checkbox__glyph--minus">
			<svg viewBox="0 0 24 24" fill="none">
				<path d="M5 12 L19 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
			</svg>
		</span>
		{#if state.loading}
			<span class="checkbox__loading" aria-hidden="true">
				<Spinner
					color={rgbTriplet(state.color)}
					size={SPINNER_SIZE}
					thickness={SPINNER_THICKNESS}
					speed={800}
				/>
			</span>
		{/if}
	</span>
{/snippet}

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>
		{@render body()}
	</span>
{/if}

<style>
	.checkbox__box {
		position: relative;
		width: 24px;
		height: 24px;
		flex: 0 0 24px;
		transform: scale(var(--ps, 1));
		transform-origin: center;
	}
	.checkbox__input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.checkbox__input:disabled {
		cursor: not-allowed;
	}
	.checkbox__input:focus-visible ~ .checkbox__mask {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 3px;
	}
	.checkbox__mask {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 32%;
		box-sizing: border-box;
		pointer-events: none;
		transition:
			background-color 180ms var(--ease-standard),
			box-shadow 180ms var(--ease-standard);
	}
	.checkbox__mask::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 2px solid rgb(var(--text) / 0.15);
		border-radius: inherit;
		box-sizing: border-box;
		opacity: calc(1 - var(--fp));
		transform: scale(calc(1 + 0.2 * var(--fp)));
		z-index: 1;
		transition: border-color 140ms var(--ease-standard);
	}
	:global(.checkbox[data-pressing]) .checkbox__mask::before {
		border-color: rgb(var(--c));
	}
	.checkbox__mask::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgb(var(--c));
		border-radius: inherit;
		opacity: var(--fp);
		transform: scale(calc(0.5 + 0.5 * var(--fp)));
	}
	.checkbox__glyph {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgb(var(--on-accent));
		z-index: 2;
	}
	.checkbox__glyph--draw svg,
	.checkbox__glyph--minus svg {
		display: block;
		width: 16px;
		height: 16px;
	}
	.checkbox__glyph--draw path {
		stroke-dasharray: 21;
		stroke-dashoffset: calc(21 * (1 - var(--dp)));
	}
	.checkbox__glyph--minus svg {
		transform: scaleX(var(--mp));
		transform-origin: center;
	}
	.checkbox__glyph--draw {
		opacity: 0;
		transition: opacity 60ms linear;
	}
	:global(.checkbox[data-show-glyph]) .checkbox__glyph--draw {
		opacity: 1;
	}
	:global(.checkbox[data-has-icon]) .checkbox__glyph--draw {
		display: none;
	}
	:global(.checkbox[data-checked]) .checkbox__input:hover ~ .checkbox__mask,
	:global(.checkbox[data-indeterminate]) .checkbox__input:hover ~ .checkbox__mask {
		box-shadow: 0 3px 15px 0 rgb(var(--c) / 0.35);
	}
	:global(.checkbox[data-disabled]) .checkbox__mask {
		opacity: 0.6;
	}
	:global(.checkbox[data-loading]) .checkbox__mask {
		background: transparent !important;
	}
	:global(.checkbox[data-loading]) .checkbox__mask::before {
		opacity: 0;
	}
	:global(.checkbox[data-loading]) .checkbox__glyph {
		opacity: 0;
	}
	.checkbox__loading {
		position: absolute;
		inset: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3;
		pointer-events: none;
	}
</style>
