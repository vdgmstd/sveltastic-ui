<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertToggleProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { MinusIcon, PlusIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getAlertCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: AlertToggleProps =
		$props();
	const root = getAlertCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: cn('alert__title', 'alert__title--collapsible', className),
			'aria-expanded': !root.isCollapsed,
			'aria-controls': root.contentId,
			'data-state': root.isCollapsed ? 'collapsed' : 'expanded',
			onclick: () => root.toggleCollapse(),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		<span class="alert__title-text">{@render children?.()}</span>
		<span class="alert__collapse" aria-hidden="true">
			{#if root.isCollapsed}
				<PlusIcon size={18} weight="bold" />
			{:else}
				<MinusIcon size={18} weight="bold" />
			{/if}
		</span>
	</button>
{/if}

<style>
	.alert__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-7);
		font-weight: 600;
		font-size: var(--fs-lg);
		-webkit-user-select: none;
		user-select: none;
	}
	.alert__title--collapsible {
		width: 100%;
		box-sizing: border-box;
		background: transparent;
		border: 0;
		color: inherit;
		font-family: inherit;
		line-height: inherit;
		text-align: inherit;
		cursor: pointer;
		padding-right: 0;
	}
	.alert__title--collapsible:focus-visible {
		outline: 2px solid rgb(255 255 255 / 0.6);
		outline-offset: -2px;
		border-radius: inherit;
	}
	.alert__title-text {
		display: inline-flex;
		align-items: center;
	}

	.alert__collapse {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		transition: transform 300ms var(--ease-standard);
	}
	.alert__title--collapsible:hover .alert__collapse { transform: rotate(-90deg); }
</style>
