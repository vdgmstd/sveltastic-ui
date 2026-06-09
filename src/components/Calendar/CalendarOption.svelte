<script lang="ts" module>
	import type { Color } from '../../types';

	export type CalendarOptionProps = {
		label: string;
		color?: Color;
		selected?: boolean;
		current?: boolean;
		disabled?: boolean;
		focused?: boolean;
		onselect?: () => void;
	};
</script>

<script lang="ts">
	import { ripple } from '../../actions/ripple.svelte';
	import { pressBounce } from '../../actions/pressBounce.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';

	let {
		label,
		color = 'primary',
		selected = false,
		current = false,
		disabled = false,
		focused = false,
		onselect
	}: CalendarOptionProps = $props();

	let triplet = $derived(rgbTriplet(color));
	const bounce = pressBounce({ disabled: () => disabled });
</script>

<button
	type="button"
	class="picker-btn picker-btn--option"
	data-selected={boolAttr(selected)}
	data-current={boolAttr(current && !selected)}
	data-disabled={boolAttr(disabled)}
	style:--c={triplet}
	style:--ps={bounce.scale}
	{disabled}
	role="option"
	tabindex={focused ? 0 : -1}
	aria-selected={selected}
	use:ripple={{ disabled, solidBg: selected, textColor: 'currentColor', color, radius: 'var(--rad-sm)' }}
	onclick={() => {
		void bounce.press();
		onselect?.();
	}}
>
	<span class="picker-btn__label">{label}</span>
</button>

<style>
	.picker-btn {
		--h: 32px;
		--w: auto;
		--r: var(--rad-sm);
		--c-text: rgb(var(--c));
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: var(--w);
		height: var(--h);
		min-width: var(--h);
		padding: 0 var(--space-4);
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--pb-font, var(--fs-sm));
		font-weight: 400;
		line-height: var(--line-height);
		border-radius: var(--r);
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
		transform: scale(var(--ps, 1));
		transform-origin: center;
		transition:
			background-color 320ms var(--ease-soft),
			box-shadow 320ms var(--ease-soft);
	}

	.picker-btn__label {
		position: relative;
		z-index: 1001;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: inherit;
		pointer-events: none;
	}

	.picker-btn--option {
		--h: var(--pb-option-h, 36px);
		--w: 100%;
		padding: 0 var(--pb-option-pad-x, var(--space-3));
		font-size: var(--pb-option-font, var(--fs-sm));
	}

	.picker-btn:hover:not([data-disabled]):not([data-selected]) {
		background: rgb(var(--c) / 0.12);
		color: var(--c-text);
	}

	.picker-btn[data-current] {
		box-shadow: inset 0 0 0 1px rgb(var(--c));
		color: var(--c-text);
	}

	.picker-btn--option[data-selected] {
		background: rgb(var(--c));
		color: rgb(255 255 255);
		box-shadow: var(--shadow-accent-sm);
	}

	.picker-btn[data-disabled] {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.picker-btn:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: -2px;
	}
</style>
