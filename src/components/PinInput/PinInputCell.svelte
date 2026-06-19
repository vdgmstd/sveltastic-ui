<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';
	import type { PinInputCell as PinInputCellData } from './context';

	export type PinInputCellProps = WithElementRef<
		{
			/** The slot object from the Root's `children` snippet `{ cells }`. */
			cell: PinInputCellData;
			/** Custom slot content; defaults to the char + a fake caret. */
			children?: Snippet;
			/** Render-delegation for the cell element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getPinInputCtx } from './context';

	let { cell, ref = $bindable(null), children, child, class: className, ...rest }: PinInputCellProps =
		$props();

	const ctx = getPinInputCtx();

	const refKey = createAttachmentKey();
	const refAttach = attachRef<HTMLDivElement>((n) => (ref = n));

	const merged = $derived(
		mergeProps(rest, {
			class: cn('pin-input__cell', className),
			'data-pin-input-cell': '',
			'data-active': boolAttr(cell.isActive),
			'data-filled': boolAttr(cell.char !== null),
			'data-disabled': boolAttr(ctx.disabled),
			'aria-hidden': 'true' as const,
			[refKey]: refAttach
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{#if children}
			{@render children()}
		{:else}
			{cell.char ?? ''}
			{#if cell.hasFakeCaret}
				<span class="pin-input__caret" aria-hidden="true"></span>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.pin-input__cell {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: 2.75rem;
		height: 3.25rem;
		border: 2px solid rgb(var(--text) / 0.15);
		border-radius: var(--rad-md);
		background: rgb(var(--gray-2));
		color: rgb(var(--text));
		font-size: var(--fs-lg);
		font-variant-numeric: tabular-nums;
		transition:
			border-color 180ms var(--ease-standard),
			box-shadow 180ms var(--ease-standard);
	}
	.pin-input__cell[data-active] {
		border-color: rgb(var(--c));
		box-shadow: 0 0 0 3px rgb(var(--c) / 0.2);
	}
	:global(.pin-input[data-invalid]) .pin-input__cell {
		border-color: rgb(var(--danger));
	}
	:global(.pin-input[data-invalid]) .pin-input__cell[data-active] {
		box-shadow: 0 0 0 3px rgb(var(--danger) / 0.2);
	}
	.pin-input__cell[data-disabled] {
		opacity: 0.5;
	}
	.pin-input__caret {
		width: 1px;
		height: 1.4em;
		background: rgb(var(--c));
		animation: pin-input-caret-blink 1s steps(1) infinite;
	}
	@keyframes pin-input-caret-blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
</style>
