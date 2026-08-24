<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, Variant, WithElementRef } from '../../types';
	import type { ToggleGroupOrientation } from './context';

	type ToggleGroupBaseProps = {
		/** Disable every item in the group. */
		disabled?: boolean;
		/** Wrap arrow navigation at the ends. */
		loop?: boolean;
		/** Layout + arrow-key axis. */
		orientation?: ToggleGroupOrientation;
		/** Let the row break onto more lines instead of overflowing at narrow widths. */
		wrap?: boolean;
		/** Roving tabindex (one tab-stop, arrows move within). Off → every item is tabbable. */
		rovingFocus?: boolean;
		/** Button visual variant applied to every item. Defaults to `transparent`. */
		variant?: Variant;
		/** Palette accent shared by the items. */
		color?: Color;
		/** Size preset shared by the items. */
		size?: Size;
		/** Border-radius shape shared by the items. */
		shape?: Shape;
		/** Disable the click ripple on the items. */
		ripple?: boolean;
		/** Accessible name for the group (→ aria-label on role="group"). */
		ariaLabel?: string;
		/** Place `ToggleGroup.Item` parts here. */
		children?: Snippet;
		/** Render-delegation for the group element. */
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

	// Single mode is split in two so a consumer who never opts into deselection keeps the source-compatible
	// `(value: string) => void` contract; passing `allowDeselect` anything but a literal `false` picks the
	// variant whose callback also receives the `undefined` a cleared selection commits.
	export type ToggleGroupRootProps = WithElementRef<
		ToggleGroupBaseProps &
			(
				| {
						type: 'single';
						value?: string;
						onValueChange?: (value: string) => void;
						/** Re-tapping the active item clears the selection (commits `undefined`). Single mode only. */
						allowDeselect?: false;
				  }
				| {
						type: 'single';
						value?: string;
						onValueChange?: (value: string | undefined) => void;
						/** Re-tapping the active item clears the selection (commits `undefined`). Single mode only. */
						allowDeselect: boolean;
				  }
				| { type: 'multiple'; value?: string[]; onValueChange?: (value: string[]) => void }
			),
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setToggleGroupCtx } from './context';
	import { ToggleGroupRootState, type ToggleGroupValue } from './toggleGroupState.svelte';

	let {
		type,
		value = $bindable(),
		onValueChange,
		disabled = false,
		allowDeselect = false,
		loop = true,
		orientation = 'horizontal',
		wrap = false,
		rovingFocus = true,
		variant = 'transparent',
		color = 'primary',
		size = 'medium',
		shape = 'default',
		ripple = true,
		ariaLabel,
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: ToggleGroupRootProps & { allowDeselect?: boolean } = $props();

	const uid = $props.id();

	const root = setToggleGroupCtx(
		new ToggleGroupRootState({
			baseId: uid,
			type: () => type,
			getValue: () => value,
			setValueProp: (v) => {
				value = v;
			},
			// Reunify the discriminated callback: the `type` prop guarantees the consumer's handler matches the value shape.
			onValueChange: () =>
				onValueChange as ((v: ToggleGroupValue | undefined) => void) | undefined,
			disabled: () => disabled,
			allowDeselect: () => type !== 'multiple' && allowDeselect,
			loop: () => loop,
			orientation: () => orientation,
			rovingFocus: () => rovingFocus,
			variant: () => variant,
			color: () => color,
			size: () => size,
			shape: () => shape,
			ripple: () => ripple
		})
	);

	$effect(() => {
		root.roving.orientation = orientation;
		root.roving.loop = loop;
	});

	const refKey = createAttachmentKey();
	const attrs = $derived({
		role: 'group' as const,
		'aria-label': ariaLabel,
		class: cn(
			'toggle-group',
			`toggle-group--${orientation}`,
			wrap && 'toggle-group--wrap',
			className
		),
		'data-orientation': orientation,
		'data-toggle-group-root': '',
		[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
	});
	const merged = $derived(mergeProps(rest, attrs));
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	:where(.toggle-group) {
		display: inline-flex;
		gap: var(--space-2);
	}
	:where(.toggle-group--vertical) {
		flex-direction: column;
		align-items: stretch;
	}
	:where(.toggle-group--wrap) {
		flex-wrap: wrap;
	}
	/* Items are Pressable button-cores; drop their standalone margin so group gap controls spacing. */
	.toggle-group :global(.button) {
		margin: 0;
	}
</style>
