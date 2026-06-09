<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Size, WithElementRef } from '../../types';
	import type { UploadError } from './upload';
	import type { UploadMessages } from './upload.svelte';
	import type { UploadVariant } from './context';

	export type UploadRootProps = WithElementRef<
		{
			/** Selected files (bindable). Read-only consumers may bind a value they never write back. */
			files?: File[];
			/** Allow multiple. */
			multiple?: boolean;
			/** Native `accept` filter (e.g. `'image/*'`, `'.pdf,.doc'`). Also enforced on drop. */
			accept?: string;
			/** Reject files larger than this many bytes. */
			maxSize?: number;
			/** Cap the total number of files. */
			maxFiles?: number;
			/** Visual variant of the inner drop area. `'default'` is dashed; `'flat'` soft fill; `'border'` solid 2px. */
			variant?: UploadVariant;
			/** Predefined size — same scale as Button/Input. */
			size?: Size;
			/** Palette accent. */
			color?: Color;
			/** Disabled. */
			disabled?: boolean;
			/** Render as a single button — no card chrome, no list. */
			buttonOnly?: boolean;
			/** Wider max-width (`480px` vs default `360px`), matching `Card`'s `wide`. */
			wide?: boolean;
			/** Drop the max-width cap and stretch to the parent container. Mutually exclusive with `wide`. */
			fullWidth?: boolean;
			/** Force a `Clear all` action in the footer when files are selected. */
			clearable?: boolean;
			/** Hide the file list even when files are selected. */
			hideList?: boolean;
			/** Force-on / force-off image thumbnails. Defaults to auto (any image file in the list). */
			thumbnails?: boolean;
			/** Tertiary hint under the dropzone (e.g. `'PNG, JPG up to 5 MB'`). */
			hint?: string;
			/** External error message. Pair with `onerror`. Replaces `hint` when set. */
			error?: string;
			/** Override the screen-reader announcements for add/remove/clear (English defaults). */
			messages?: Partial<UploadMessages>;
			/** Compound parts (`Upload.Dropzone`/`Upload.List`/`Upload.Footer`). */
			children?: Snippet;
			/** Fired with rejected files when validation trims the input. */
			onerror?: (errors: UploadError[]) => void;
			/** Canonical change callback — fires on file selection / drop after validation. */
			onValueChange?: (files: File[]) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color' | 'onchange' | 'onerror'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { boolAttr } from '../../utils/attrs';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { setUploadContext } from './context';
	import { UploadRootState } from './uploadState.svelte';

	let {
		files = $bindable<File[]>([]),
		multiple = false,
		accept,
		maxSize,
		maxFiles,
		variant = 'default',
		size = 'medium',
		color = 'primary',
		disabled = false,
		buttonOnly = false,
		wide = false,
		fullWidth = false,
		clearable = false,
		hideList = false,
		thumbnails,
		hint,
		error,
		messages,
		children,
		onerror,
		onValueChange,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: UploadRootProps = $props();

	const metaId = $props.id();
	const root = setUploadContext(
		new UploadRootState(
			{
				getFiles: () => files,
				setFilesValue: (v) => (files = v),
				multiple: () => multiple,
				disabled: () => disabled,
				accept: () => accept,
				maxSize: () => maxSize,
				maxFiles: () => maxFiles,
				size: () => size,
				color: () => color,
				thumbnails: () => thumbnails,
				listHidden: () => hideList,
				hint: () => hint,
				error: () => error,
				clearable: () => clearable,
				buttonOnly: () => buttonOnly,
				onerror: (e) => onerror?.(e),
				onValueChange: (v) => onValueChange?.(v),
				messages: () => messages
			},
			metaId
		)
	);
	const ctl = root.ctl;

	$effect(() => root.syncDragTween());
	$effect(() => ctl.listenWindowReset());
	$effect(() => root.syncThumbs());
	$effect(() => () => root.destroy());

	const rootProps = $derived(
		mergeProps(rest, {
			'data-testid': 'upload',
			'data-state': ctl.dragOver ? 'drag-over' : undefined,
			'data-drag-over': boolAttr(ctl.dragOver),
			'data-wide': boolAttr(wide),
			'data-full-width': boolAttr(fullWidth),
			'data-clearable': boolAttr(clearable),
			'data-disabled': boolAttr(disabled),
			ondragenter: (e: DragEvent) => ctl.handleDragEnter(e),
			ondragover: (e: DragEvent) => e.preventDefault(),
			ondragleave: () => ctl.handleDragLeave(),
			ondrop: (e: DragEvent) => ctl.handleDrop(e)
		})
	);
</script>

{#if buttonOnly}
	<div
		{...mergeProps(rest, {
			'data-testid': 'upload',
			'data-button-only': '',
			'data-state': ctl.dragOver ? 'drag-over' : undefined,
			'data-disabled': boolAttr(disabled)
		})}
		class={cn(
			'upload',
			'upload--button-only',
			`upload--${variant}`,
			`upload--size-${size}`,
			disabled && 'upload--disabled',
			className
		)}
		style:--c={root.triplet}
		style:--dp={ctl.dragTween.current}
		style={userStyle}
		{@attach attachRef((n) => (ref = n))}
	>
		{@render children?.()}
		<input
			bind:this={root.inputEl}
			class="upload__input"
			type="file"
			{accept}
			{multiple}
			disabled={disabled || undefined}
			onchange={(e) => {
				const t = e.currentTarget;
				ctl.setFiles(t.files);
				t.value = '';
			}}
		/>
		<span class="upload__sr" aria-live="polite">{ctl.liveMessage}</span>
	</div>
{:else}
	<div
		{...rootProps}
		class={cn(
			'upload',
			'upload--field',
			`upload--${variant}`,
			`upload--size-${size}`,
			wide && 'upload--wide',
			fullWidth && 'upload--full-width',
			disabled && 'upload--disabled',
			className
		)}
		style:--c={root.triplet}
		style:--dp={ctl.dragTween.current}
		style={userStyle}
		role="presentation"
		data-has-files={boolAttr(root.hasFiles)}
		data-has-error={boolAttr(!!error)}
		use:rippleAction={{ disabled, solidBg: false }}
		{@attach attachRef((n) => (ref = n))}
	>
		<span class="upload__bg" aria-hidden="true"></span>

		{@render children?.()}

		<input
			bind:this={root.inputEl}
			class="upload__input"
			type="file"
			{accept}
			{multiple}
			disabled={disabled || undefined}
			aria-invalid={!!error || undefined}
			aria-describedby={hint || error ? root.metaId : undefined}
			onchange={(e) => {
				const t = e.currentTarget;
				ctl.setFiles(t.files);
				t.value = '';
			}}
		/>

		<span class="upload__sr" aria-live="polite">{ctl.liveMessage}</span>
	</div>
{/if}

<style>
	:where(.upload) {
		--c: var(--primary);
		--dp: 0;
		--upload-pad: var(--space-6);
		--upload-radius: var(--rad-lg);
		/* Hero paddings exceed the 24px scale cap — kept literal so the morph keeps distinct steps. */
		--upload-hero-pad-y: 28px;
		--upload-hero-pad-x: 18px;
		--upload-label-size: var(--fs-md);
		--upload-compact-pad: var(--space-6);
		--upload-item-font: var(--fs-md);
		--upload-item-thumb: 36px;

		display: block;
	}

	:where(.upload--field) {
		--sa-color: var(--c);
		position: relative;
		isolation: isolate;
		container-type: inline-size;
		container-name: upload;
		width: 100%;
		max-width: 360px;
		padding: var(--upload-pad);
		border-radius: var(--upload-radius);
		color: rgb(var(--text));
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		box-sizing: border-box;
		transition: padding 280ms var(--ease-standard);
	}
	.upload--field > :global(*) {
		min-width: 0;
	}

	/* Spacing between siblings via margin (not flex gap) — slide animates margin-bottom in lockstep with height, so no jump on unmount. */
	.upload--field > :global(.upload__list) {
		margin-block-end: var(--upload-pad);
	}
	.upload--field > :global(.upload__hero:has(~ .upload__error)),
	.upload--field > :global(.upload__hero:has(~ .upload__footer)) {
		margin-block-end: var(--upload-pad);
	}
	.upload--field > :global(.upload__error:has(~ .upload__footer)) {
		margin-block-end: var(--upload-pad);
	}

	/* Ripple — subtle accent wave clipped inside the dashed/border bg; low opacity, mix-blend keeps it readable on both themes. */
	.upload--field :global(.ripple__layer) {
		inset: 2px;
		z-index: 1;
		border-radius: calc(var(--upload-radius) - 2px);
		opacity: 0.08;
		mix-blend-mode: multiply;
	}
	:global([data-theme='dark']) .upload--field :global(.ripple__layer) {
		opacity: 0.12;
		mix-blend-mode: screen;
	}
	.upload--field.upload--wide {
		max-width: 480px;
	}
	.upload--field.upload--full-width {
		max-width: none;
	}

	:where(.upload--size-xl) {
		--upload-radius: var(--rad-xl);
		--upload-pad: var(--space-8);
		--upload-hero-pad-y: 38px;
		--upload-hero-pad-x: 22px;
		--upload-label-size: var(--fs-lg);
		--upload-compact-pad: var(--space-8);
		--upload-item-font: var(--fs-lg);
		--upload-item-thumb: 44px;
	}
	:where(.upload--size-large) {
		--upload-radius: var(--rad-lg);
		--upload-pad: var(--space-7);
		--upload-hero-pad-y: 32px;
		--upload-hero-pad-x: 20px;
		--upload-label-size: var(--fs-lg);
		--upload-compact-pad: var(--space-7);
		--upload-item-font: var(--fs-md);
		--upload-item-thumb: 40px;
	}
	:where(.upload--size-small) {
		--upload-radius: var(--rad-md);
		--upload-pad: var(--space-5);
		--upload-hero-pad-y: 20px;
		--upload-hero-pad-x: 14px;
		--upload-label-size: var(--fs-md);
		--upload-compact-pad: var(--space-5);
		--upload-item-font: var(--fs-sm);
		--upload-item-thumb: 32px;
	}
	:where(.upload--size-mini) {
		--upload-radius: var(--rad-sm);
		--upload-pad: var(--space-4);
		--upload-hero-pad-y: 14px;
		--upload-hero-pad-x: 12px;
		--upload-label-size: var(--fs-sm);
		--upload-compact-pad: var(--space-4);
		--upload-item-font: var(--fs-sm);
		--upload-item-thumb: 30px;
	}

	.upload__bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		border-radius: inherit;
		background: rgb(var(--c) / calc(0.05 + 0.06 * var(--dp)));
		transition: background-color 220ms var(--ease-standard);
		pointer-events: none;
	}

	.upload--default .upload__bg {
		border: 2px dashed
			color-mix(in oklab, rgb(var(--c) / 0.4), rgb(var(--c)) calc(var(--dp) * 100%));
	}
	.upload--flat .upload__bg {
		border: 0;
		background: rgb(var(--c) / calc(0.08 + 0.06 * var(--dp)));
	}
	.upload--border .upload__bg {
		border: 2px solid rgb(var(--c) / calc(0.45 + 0.45 * var(--dp)));
		background: rgb(var(--c) / calc(0.04 + 0.05 * var(--dp)));
	}

	.upload--field[data-has-error].upload--default .upload__bg,
	.upload--field[data-has-error].upload--border .upload__bg {
		border-color: rgb(var(--danger) / 0.6);
	}

	:where(.upload--field[data-drag-over]) {
		transform: translateY(-1px);
	}

	/* Hero — the click target. Always vertical: plate above text. Sizes/paddings/colors animate. */
	.upload--field :global(.upload__hero) {
		position: relative;
		z-index: 2;
		-webkit-user-select: none;
		user-select: none;
		flex: 1 1 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		width: 100%;
		min-width: 0;
		padding: var(--upload-hero-pad-y) var(--upload-hero-pad-x);
		background: transparent;
		color: rgb(var(--c));
		border: 1px solid transparent;
		border-radius: calc(var(--upload-radius) - 4px);
		font: inherit;
		font-size: var(--upload-label-size);
		cursor: pointer;
		outline: none;
		text-align: center;
		transition:
			flex-basis 280ms var(--ease-standard),
			padding 280ms var(--ease-standard),
			gap 280ms var(--ease-standard),
			font-size 280ms var(--ease-standard),
			background-color 240ms var(--ease-standard),
			border-color 240ms var(--ease-standard),
			border-radius 280ms var(--ease-standard);
		box-sizing: border-box;
	}
	.upload--field :global(.upload__hero:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.upload--field :global(.upload__plate) {
		--plate-size: 56px;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: var(--plate-size);
		height: var(--plate-size);
		color: rgb(var(--c));
		transition:
			width 280ms var(--ease-standard),
			height 280ms var(--ease-standard),
			transform 220ms var(--ease-standard);
	}
	.upload--size-xl :global(.upload__plate) {
		--plate-size: 68px;
	}
	.upload--size-large :global(.upload__plate) {
		--plate-size: 60px;
	}
	.upload--size-small :global(.upload__plate) {
		--plate-size: 44px;
	}
	.upload--size-mini :global(.upload__plate) {
		--plate-size: 36px;
	}

	.upload--field :global(.upload__plate-ring) {
		position: absolute;
		inset: -6px;
		border-radius: var(--rad-circle);
		background: rgb(var(--c) / calc(0.08 + 0.08 * var(--dp)));
		transform: scale(calc(0.9 + 0.1 * var(--dp)));
		transition:
			background-color 240ms var(--ease-standard),
			transform 240ms var(--ease-standard);
		pointer-events: none;
	}
	.upload--field :global(.upload__plate-inner) {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: var(--rad-circle);
		background: rgb(var(--c) / calc(0.16 + 0.1 * var(--dp)));
		transition: background-color 240ms var(--ease-standard);
	}
	.upload--field :global(.upload__hero[data-drag-over] .upload__plate) {
		transform: translateY(-3px);
	}

	.upload--field :global(.upload__text) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		min-width: 0;
		max-width: 100%;
		transition: gap 280ms var(--ease-standard);
	}
	.upload--field :global(.upload__label) {
		font-size: var(--upload-label-size);
		font-weight: 600;
		line-height: 1.3;
		color: rgb(var(--text));
		max-width: 100%;
		text-wrap: balance;
		overflow-wrap: anywhere;
		transition: font-size 280ms var(--ease-standard);
	}
	.upload--field :global(.upload__sublabel) {
		font-size: calc(var(--upload-label-size) * 0.85);
		opacity: 0.55;
		color: rgb(var(--text));
		max-width: 100%;
		transition:
			font-size 280ms var(--ease-standard),
			opacity 280ms var(--ease-standard);
	}
	.upload--field :global(.upload__hint) {
		display: inline-block;
		margin-top: var(--space-3);
		padding: var(--space-1) var(--space-5);
		font-size: var(--fs-xs);
		font-weight: 500;
		color: rgb(var(--c));
		background: rgb(var(--c) / 0.1);
		border-radius: var(--rad-pill);
		max-width: 100%;
		overflow-wrap: anywhere;
		text-align: center;
		opacity: 1;
		transform: scale(1);
		transform-origin: top center;
		transition:
			opacity 280ms var(--ease-standard),
			transform 280ms var(--ease-standard),
			margin-top 280ms var(--ease-standard),
			max-height 280ms var(--ease-standard),
			padding 280ms var(--ease-standard);
		max-height: 60px;
		overflow: hidden;
	}

	.upload--field :global(.upload__error) {
		flex: 1 1 100%;
		position: relative;
		z-index: 2;
		padding: 0 var(--space-2);
		color: rgb(var(--danger));
		font-size: var(--fs-sm);
	}

	.upload__input {
		display: none;
	}

	.upload--disabled :global(.upload__hero) {
		cursor: not-allowed;
	}
	:where(.upload--disabled) {
		opacity: 0.6;
	}

	.upload--field :global(.upload__list) {
		flex: 1 1 100%;
		position: relative;
		z-index: 2;
		margin-block-start: 0;
		margin-inline: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: 280px;
		overflow-y: auto;
		min-width: 0;
	}

	.upload--field :global(.upload__item) {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		-webkit-user-select: none;
		user-select: none;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-3) var(--space-4) var(--space-3) var(--space-3);
		border-radius: var(--rad-sm);
		font-size: var(--upload-item-font);
		min-width: 0;
		transition:
			background-color 200ms var(--ease-standard),
			transform 200ms var(--ease-standard);
	}
	.upload--field :global(.upload__item:hover) {
		background: rgb(var(--c) / 0.1);
	}

	.upload--field :global(.upload__item-thumb) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--upload-item-thumb);
		height: var(--upload-item-thumb);
		border-radius: var(--rad-sm);
		background: rgb(var(--c) / 0.14);
		color: rgb(var(--c));
		overflow: hidden;
		flex: none;
	}
	.upload--field :global(.upload__item-img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.upload--field :global(.upload__item-text) {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: var(--space-1);
	}
	.upload--field :global(.upload__item-name) {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}
	.upload--field :global(.upload__item-size) {
		font-size: var(--fs-sm);
		opacity: 0.6;
		font-variant-numeric: tabular-nums;
	}

	.upload--field :global(.upload__item-remove) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 24px;
		height: 24px;
		background: transparent;
		border: 0;
		border-radius: var(--rad-xs);
		color: inherit;
		cursor: pointer;
		opacity: 0.55;
		transition:
			background-color 180ms var(--ease-standard),
			color 180ms var(--ease-standard),
			opacity 180ms var(--ease-standard);
	}
	.upload--field :global(.upload__item-remove:hover) {
		opacity: 1;
		background: rgb(var(--danger) / 0.15);
		color: rgb(var(--danger));
	}
	.upload--field :global(.upload__item-remove:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
		opacity: 1;
	}

	.upload--field :global(.upload__footer) {
		flex: 1 1 100%;
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		flex-wrap: wrap;
		padding-top: var(--space-5);
		border-top: 1px solid rgb(var(--c) / 0.12);
		font-size: var(--fs-sm);
		color: rgb(var(--text));
	}
	.upload--field :global(.upload__count) {
		display: inline-flex;
		gap: var(--space-3);
		min-width: 0;
		opacity: 0.7;
		-webkit-user-select: none;
		user-select: none;
		flex-wrap: wrap;
	}
	.upload--field :global(.upload__dot) {
		opacity: 0.5;
	}
	.upload--field :global(.upload__total) {
		font-variant-numeric: tabular-nums;
	}

	.upload--field :global(.upload__clear) {
		--sa-color: var(--danger);
		display: inline-flex;
		align-items: center;
		-webkit-user-select: none;
		user-select: none;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-5);
		background: rgb(var(--danger) / 0.1);
		color: rgb(var(--danger));
		border: 0;
		border-radius: var(--rad-sm);
		font: inherit;
		font-size: var(--fs-sm);
		font-weight: 500;
		cursor: pointer;
		flex: none;
		transition:
			background-color 180ms var(--ease-standard),
			transform 180ms var(--ease-standard);
	}
	.upload--field :global(.upload__clear:hover) {
		background: rgb(var(--danger) / 0.18);
		transform: translateY(-1px);
	}
	.upload--field :global(.upload__clear:focus-visible) {
		outline: 2px solid rgb(var(--danger) / 0.6);
		outline-offset: 2px;
	}

	/* With files: hero compresses (smaller padding/plate/font, hint collapses); on wide containers it becomes a fixed side column. */
	.upload--field[data-has-files] :global(.upload__hero) {
		gap: var(--space-3);
		padding: var(--upload-compact-pad) var(--upload-compact-pad);
		font-size: calc(var(--upload-label-size) * 0.92);
		background: rgb(var(--c) / 0.06);
		border-radius: var(--rad-sm);
	}
	.upload--field[data-has-files] :global(.upload__hero:hover) {
		background: rgb(var(--c) / 0.1);
	}
	.upload--field[data-has-files] :global(.upload__plate) {
		--plate-size: 38px;
	}
	.upload--field[data-has-files] :global(.upload__text) {
		gap: 1px;
	}
	.upload--field[data-has-files] :global(.upload__label) {
		font-size: calc(var(--upload-label-size) * 0.92);
	}
	.upload--field[data-has-files] :global(.upload__sublabel) {
		font-size: calc(var(--upload-label-size) * 0.78);
	}
	.upload--field[data-has-files] :global(.upload__hint) {
		opacity: 0;
		transform: scale(0.92);
		max-height: 0;
		margin-top: 0;
		padding-top: 0;
		padding-bottom: 0;
	}

	@container upload (min-width: 460px) {
		.upload--field[data-has-files] :global(.upload__list) {
			flex: 1 1 60%;
			margin-block-end: 0;
			margin-inline-end: var(--upload-pad);
		}
		.upload--field[data-has-files] :global(.upload__hero) {
			flex: 0 0 150px;
			align-self: stretch;
			padding: var(--space-6) var(--space-5);
			background: rgb(var(--c) / 0.05);
			border: 1px dashed rgb(var(--c) / 0.3);
			border-radius: var(--rad-sm);
			margin-block-end: var(--upload-pad);
		}
	}

	@container upload (max-width: 320px) {
		.upload--field :global(.upload__item-thumb) {
			width: 30px;
			height: 30px;
		}
		.upload--field :global(.upload__item) {
			gap: var(--space-4);
			padding: var(--space-3) var(--space-3) var(--space-3) var(--space-3);
		}
		.upload--field :global(.upload__total),
		.upload--field :global(.upload__dot) {
			display: none;
		}
	}

	.upload__sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.upload--field :global(.upload__list::-webkit-scrollbar) {
		width: 6px;
	}
	.upload--field :global(.upload__list::-webkit-scrollbar-thumb) {
		background: rgb(var(--c) / 0.25);
		border-radius: 3px;
	}

	/* button-only — inline row button, no card chrome or list */
	.upload--button-only :global(.upload__zone--button) {
		--sa-color: var(--c);
		position: relative;
		isolation: isolate;
		-webkit-user-select: none;
		user-select: none;
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: var(--space-4);
		max-width: 100%;
		padding: var(--space-5) var(--space-7);
		background: transparent;
		color: rgb(var(--c));
		border: 0;
		border-radius: var(--upload-radius);
		font: inherit;
		font-size: var(--upload-label-size);
		cursor: pointer;
		transition: transform 220ms var(--ease-standard);
	}
	.upload--button-only :global(.upload__zone-content) {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: var(--space-4);
		min-width: 0;
		max-width: 100%;
		pointer-events: none;
	}
	.upload--button-only :global(.upload__zone-bg) {
		position: absolute;
		inset: 0;
		z-index: 0;
		border-radius: inherit;
		background: rgb(var(--c) / calc(0.1 + 0.08 * var(--dp)));
		pointer-events: none;
	}
	.upload--button-only :global(.upload__zone--button:hover:not(:disabled)) {
		transform: translateY(-1px);
	}
	.upload--button-only :global(.upload__zone--button:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
	.upload--button-only :global(.upload__label) {
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
