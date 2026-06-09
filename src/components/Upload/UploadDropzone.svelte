<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type UploadDropzoneProps = WithElementRef<
		{
			/** Drop-zone primary label (the bold headline). */
			label?: string;
			/** Drop-zone secondary line under `label`. Default: `'or click to browse'`. */
			sublabel?: string;
			/** Accessible name for the drop zone / button when no visible label is rendered. */
			ariaLabel?: string;
			/** Custom drop-zone content (replaces icon + label). */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own button. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'type'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { UploadSimpleIcon } from 'phosphor-svelte';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { useUploadContext } from './context';

	let {
		label = 'Drop files here',
		sublabel = 'or click to browse',
		ariaLabel,
		children,
		child,
		class: className,
		ref = $bindable(null),
		...rest
	}: UploadDropzoneProps = $props();

	const root = useUploadContext();
	const refKey = createAttachmentKey();

	const heroProps = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: 'upload__hero',
			disabled: root.disabled || undefined,
			'aria-label': ariaLabel,
			'aria-describedby': root.hint || root.error ? root.metaId : undefined,
			'data-drag-over': boolAttr(root.ctl.dragOver),
			onclick: () => root.openPicker()
		}, {
			class: className,
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);

	const buttonProps = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: 'upload__zone upload__zone--button',
			disabled: root.disabled || undefined,
			'aria-label': ariaLabel,
			'data-drag-over': boolAttr(root.ctl.dragOver),
			onclick: () => root.openPicker(),
			ondragenter: (e: DragEvent) => root.ctl.handleDragEnter(e),
			ondragover: (e: DragEvent) => e.preventDefault(),
			ondragleave: () => root.ctl.handleDragLeave(),
			ondrop: (e: DragEvent) => root.ctl.handleDrop(e)
		}, {
			class: className,
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);

	const merged = $derived(root.buttonOnly ? buttonProps : heroProps);
</script>

{#if child}
	{@render child({ props: merged })}
{:else if root.buttonOnly}
	<button {...merged} use:rippleAction={{ disabled: root.disabled, solidBg: false }}>
		<span class="upload__zone-bg" aria-hidden="true"></span>
		<span class="upload__zone-content">
			{#if children}
				{@render children()}
			{:else}
				<UploadSimpleIcon size={root.zoneIconSize} weight="bold" />
				<span class="upload__label">{label}</span>
			{/if}
		</span>
	</button>
{:else}
	<button {...merged}>
		{#if children}
			{@render children()}
		{:else}
			<span class="upload__plate" aria-hidden="true">
				<span class="upload__plate-ring"></span>
				<span class="upload__plate-inner">
					<UploadSimpleIcon size={root.zoneIconSize} weight="duotone" />
				</span>
			</span>
			<span class="upload__text">
				<span class="upload__label">{label}</span>
				<span class="upload__sublabel">{sublabel}</span>
			</span>
			{#if root.hint && !root.error}
				<span class="upload__hint" id={root.metaId}>{root.hint}</span>
			{/if}
		{/if}
	</button>
	{#if root.error}
		<div id={root.metaId} class="upload__error" role="alert">{root.error}</div>
	{/if}
{/if}
