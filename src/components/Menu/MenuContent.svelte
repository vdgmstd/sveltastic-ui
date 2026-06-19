<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type MenuContentProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			/** Menu rows — `Menu.Item` / `Menu.CheckboxItem` / `Menu.RadioGroup` / `Menu.Group` / `Menu.Separator`. Receives a `close` callback so custom content can dismiss the menu. */
			children?: Snippet<[() => void]>;
			/** Render-delegation: receive the merged props + a `body` snippet of the rows and render your own content element. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { getMenuCtx } from './context';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: MenuContentProps = $props();
	const root = getMenuCtx();

	const setRef = (node: HTMLElement | null): void => {
		ref = node as HTMLDivElement | null;
	};
	const merged = $derived(mergeProps(rest, { class: cn(className) || undefined }));

	$effect(() => {
		root.contentSnippet = body;
		root.contentChild = child;
		root.setContentRef = setRef;
		return () => {
			if (root.contentSnippet === body) root.contentSnippet = undefined;
			root.contentChild = undefined;
			root.setContentRef = undefined;
		};
	});
	$effect(() => {
		root.contentProps = merged;
		return () => {
			root.contentProps = {};
		};
	});
</script>

{#snippet body(close: () => void)}
	{@render children?.(close)}
{/snippet}
