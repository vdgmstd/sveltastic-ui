<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size } from '../../types';
	import type { CollapseVariant } from './Collapse.svelte';

	export type CollapseGroupLayout = 'stack' | 'fused' | 'card';

	export type CollapseGroupProps = {
		/** Selection mode. `single` collapses siblings on open; `multiple` allows any combination. */
		mode?: 'single' | 'multiple';
		/** Bonded item keys (or single key when `mode='single'`). Two-way bindable. */
		value?: string | string[] | null;
		/** Visual layout. `stack` — separate cards with gap. `fused` — items joined as one block. `card` — wrapped in a shared card surface. */
		layout?: CollapseGroupLayout;
		/** Default `variant` cascaded to children. */
		variant?: CollapseVariant;
		/** Default `color` cascaded to children. */
		color?: Color;
		/** Default `size` cascaded to children. */
		size?: Size;
		/** Default `shape` cascaded to children. */
		shape?: Shape;
		/** Vertical gap between items (px). Ignored for `fused` and `card` layouts. */
		gap?: number;
		/** Title row above the items (visible in all layouts). */
		title?: string;
		/** Header snippet — overrides `title`. */
		header?: Snippet;
		/** Footer row below the items. */
		footer?: Snippet;
		/** Group children. */
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'>;

	type CollapseGroupContext = {
		readonly mode: 'single' | 'multiple';
		readonly variant: CollapseVariant | undefined;
		readonly color: Color | undefined;
		readonly size: Size | undefined;
		readonly shape: Shape | undefined;
		readonly layout: CollapseGroupLayout;
		isOpen(key: string): boolean;
		toggle(key: string, next: boolean): void;
		register(): string;
	};

	const CONTEXT_KEY = Symbol('collapse-group');

	export function getCollapseGroupContext(): CollapseGroupContext | undefined {
		return getContext(CONTEXT_KEY);
	}

	import { getContext, setContext } from 'svelte';
</script>

<script lang="ts">
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';

	let {
		mode = 'single',
		value = $bindable(mode === 'multiple' ? [] : null),
		layout = 'stack',
		variant,
		color,
		size,
		shape,
		gap = 8,
		title = '',
		header,
		footer,
		children,
		class: className,
		style: userStyle,
		...rest
	}: CollapseGroupProps = $props();

	let triplet = $derived(color ? rgbTriplet(color) : undefined);
	let autoCounter = 0;

	const ctx: CollapseGroupContext = {
		get mode() {
			return mode;
		},
		get variant() {
			return variant;
		},
		get color() {
			return color;
		},
		get size() {
			return size;
		},
		get shape() {
			return shape;
		},
		get layout() {
			return layout;
		},
		isOpen(key) {
			if (mode === 'single') return value === key;
			return Array.isArray(value) && value.includes(key);
		},
		toggle(key, next) {
			if (mode === 'single') {
				value = next ? key : null;
				return;
			}
			const arr = Array.isArray(value) ? value : [];
			value = next ? [...arr.filter((k) => k !== key), key] : arr.filter((k) => k !== key);
		},
		register() {
			autoCounter += 1;
			return nextId(`collapse-item-${autoCounter}`);
		}
	};

	setContext(CONTEXT_KEY, ctx);
</script>

<div
	class={cn('collapse-group', `collapse-group--${layout}`, className)}
	style:--collapse-group-gap="{gap}px"
	style:--cg-c={triplet}
	style={userStyle}
	data-testid="collapse-group"
	{...rest}
>
	{#if header || title}
		<div class="collapse-group__header">
			{#if header}{@render header()}{:else}{title}{/if}
		</div>
	{/if}

	<div class="collapse-group__body">
		{@render children?.()}
	</div>

	{#if footer}
		<div class="collapse-group__footer">{@render footer()}</div>
	{/if}
</div>

<style>
	:where(.collapse-group) {
		display: flex;
		flex-direction: column;
		width: 100%;
		color: rgb(var(--text));
		box-sizing: border-box;
	}

	.collapse-group__body {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.collapse-group__header,
	.collapse-group__footer {
		min-width: 0;
	}

	.collapse-group--stack > .collapse-group__header {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
		margin-bottom: 8px;
	}
	.collapse-group--stack > .collapse-group__footer {
		font-size: 0.8rem;
		opacity: 0.6;
		margin-top: 8px;
	}

	.collapse-group--stack > .collapse-group__body {
		gap: var(--collapse-group-gap, 8px);
	}

	.collapse-group--fused > .collapse-group__header {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
		margin-bottom: 8px;
	}
	.collapse-group--fused > .collapse-group__footer {
		font-size: 0.8rem;
		opacity: 0.6;
		margin-top: 8px;
	}

	.collapse-group--fused > .collapse-group__body {
		gap: 0;
	}
	.collapse-group--fused > .collapse-group__body :global(.collapse + .collapse) {
		margin-top: -1px;
	}
	.collapse-group--fused
		> .collapse-group__body
		:global(.collapse:not(:first-child):not(:last-child)) {
		border-radius: 0;
	}
	.collapse-group--fused > .collapse-group__body :global(.collapse:first-child) {
		border-end-start-radius: 0;
		border-end-end-radius: 0;
	}
	.collapse-group--fused > .collapse-group__body :global(.collapse:last-child) {
		border-start-start-radius: 0;
		border-start-end-radius: 0;
	}

	:where(.collapse-group--card) {
		background: rgb(var(--gray-1));
		border-radius: var(--radius);
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-4)),
			0 5px 20px 0 rgb(0 0 0 / calc(var(--shadow-opacity) * 0.7));
		overflow: hidden;
	}

	.collapse-group--card > .collapse-group__header {
		padding: 16px 20px;
		font-weight: 600;
		font-size: 0.95rem;
		color: rgb(var(--cg-c, var(--text)));
		border-bottom: 1px solid rgb(var(--gray-4));
		background: rgb(var(--background) / 0.5);
	}

	.collapse-group--card > .collapse-group__footer {
		padding: 12px 20px;
		font-size: 0.85rem;
		opacity: 0.75;
		border-top: 1px solid rgb(var(--gray-4));
		background: rgb(var(--background) / 0.5);
	}

	.collapse-group--card > .collapse-group__body :global(.collapse) {
		border-radius: 0;
	}
	.collapse-group--card > .collapse-group__body :global(.collapse::before),
	.collapse-group--card > .collapse-group__body :global(.collapse::after) {
		display: none;
	}
	.collapse-group--card > .collapse-group__body :global(.collapse:not(:last-child)) {
		border-bottom: 1px solid rgb(var(--gray-4));
	}

	:global([data-theme='dark']) :where(.collapse-group--card) {
		background: rgb(var(--gray-1));
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-2)),
			0 5px 20px 0 rgb(0 0 0 / calc(var(--shadow-opacity) * 0.6));
	}
	:global([data-theme='dark']) .collapse-group--card > .collapse-group__header,
	:global([data-theme='dark']) .collapse-group--card > .collapse-group__footer {
		border-color: rgb(var(--gray-2));
		background: rgb(var(--gray-2) / 0.4);
	}
	:global([data-theme='dark'])
		.collapse-group--card
		> .collapse-group__body
		:global(.collapse:not(:last-child)) {
		border-bottom-color: rgb(var(--gray-2));
	}
</style>
