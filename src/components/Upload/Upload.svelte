<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Size } from '../../types';

	export type UploadVariant = 'default' | 'flat' | 'border';

	export type UploadErrorReason = 'size' | 'count' | 'type';

	export type UploadError = {
		file: File;
		reason: UploadErrorReason;
		max?: number;
	};

	export type UploadItemContext = {
		file: File;
		remove: () => void;
		thumbnail?: string;
	};

	export type UploadFooterContext = {
		files: File[];
		totalSize: number;
		clear: () => void;
	};

	export type UploadProps = {
		/** Selected files (bindable). */
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
		/** Hide the list even when files are selected. */
		showList?: boolean;
		/** Force-on / force-off image thumbnails. Defaults to auto (any image file in the list). */
		thumbnails?: boolean;
		/** Drop-zone primary label (the bold headline). */
		label?: string;
		/** Drop-zone secondary line under `label`. Default: `'or click to browse'`. */
		sublabel?: string;
		/** Tertiary hint under the dropzone (e.g. `'PNG, JPG up to 5 MB'`). */
		hint?: string;
		/** External error message. Pair with `onerror`. Replaces `hint` when set. */
		error?: string;
		/** Custom drop-zone content (replaces icon + label). */
		children?: Snippet;
		/** Custom rendering of one list item. Overrides the built-in row. */
		item?: Snippet<[UploadItemContext]>;
		/** Custom footer (replaces the built-in "N files · size · clear" row). */
		footer?: Snippet<[UploadFooterContext]>;
		/** Fired on file selection / drop after validation. */
		onchange?: (files: File[]) => void;
		/** Fired with rejected files when validation trims the input. */
		onerror?: (errors: UploadError[]) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import {
		UploadSimpleIcon,
		XIcon,
		FileIcon,
		ImageIcon,
		FilePdfIcon,
		FileTextIcon,
		FileVideoIcon,
		FileAudioIcon,
		FileZipIcon,
		TrashIcon
	} from 'phosphor-svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';

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
		showList = true,
		thumbnails,
		label = 'Drop files here',
		sublabel = 'or click to browse',
		hint,
		error,
		children,
		item,
		footer,
		onchange,
		onerror,
		class: className,
		style: userStyle
	}: UploadProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let dragDepth = $state(0);
	let dragOver = $derived(!disabled && dragDepth > 0);
	let inputEl: HTMLInputElement | undefined = $state();
	let liveMessage = $state('');

	let dragTween = new Tween(0, { duration: 220, easing: cubicOut });
	$effect(() => {
		dragTween.target = dragOver ? 1 : 0;
	});

	let showThumbs = $derived(
		thumbnails ?? files.some((f) => f.type.startsWith('image/'))
	);

	let totalSize = $derived(files.reduce((a, f) => a + f.size, 0));

	let thumbCache = new Map<File, string>();
	let thumbVersion = $state(0);

	$effect(() => {
		const current = files;
		let changed = false;
		for (const f of current) {
			if (!thumbCache.has(f) && f.type.startsWith('image/')) {
				thumbCache.set(f, URL.createObjectURL(f));
				changed = true;
			}
		}
		for (const [f, url] of thumbCache) {
			if (!current.includes(f)) {
				URL.revokeObjectURL(url);
				thumbCache.delete(f);
				changed = true;
			}
		}
		if (changed) thumbVersion++;
	});

	$effect(() => {
		return () => {
			for (const url of thumbCache.values()) URL.revokeObjectURL(url);
			thumbCache.clear();
		};
	});

	function matchesAccept(file: File, pattern: string): boolean {
		const tokens = pattern.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
		if (tokens.length === 0) return true;
		const name = file.name.toLowerCase();
		const type = file.type.toLowerCase();
		return tokens.some((t) => {
			if (t.startsWith('.')) return name.endsWith(t);
			if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1));
			return type === t;
		});
	}

	function validate(input: File[]): { keep: File[]; errors: UploadError[] } {
		const errors: UploadError[] = [];
		const keep: File[] = [];
		const room = maxFiles !== undefined ? Math.max(0, maxFiles - files.length) : Infinity;
		const slot = multiple ? room : 1;

		for (const f of input) {
			if (accept && !matchesAccept(f, accept)) {
				errors.push({ file: f, reason: 'type' });
				continue;
			}
			if (maxSize !== undefined && f.size > maxSize) {
				errors.push({ file: f, reason: 'size', max: maxSize });
				continue;
			}
			if (keep.length >= slot) {
				errors.push({ file: f, reason: 'count', max: maxFiles });
				continue;
			}
			keep.push(f);
		}
		return { keep, errors };
	}

	function setFiles(list: FileList | File[] | null): void {
		if (!list || disabled) return;
		const arr = Array.from(list);
		const { keep, errors } = validate(arr);
		if (errors.length) onerror?.(errors);
		if (keep.length === 0) return;
		files = multiple ? [...files, ...keep] : keep.slice(0, 1);
		liveMessage =
			keep.length === 1 ? `${keep[0].name} added` : `${keep.length} files added`;
		onchange?.(files);
	}

	function remove(file: File): void {
		files = files.filter((f) => f !== file);
		liveMessage = `${file.name} removed`;
		onchange?.(files);
	}

	function clear(): void {
		const count = files.length;
		files = [];
		liveMessage = `${count} files removed`;
		onchange?.(files);
	}

	function handleDragEnter(event: DragEvent): void {
		event.preventDefault();
		if (disabled) return;
		dragDepth++;
	}
	function handleDragLeave(): void {
		if (dragDepth > 0) dragDepth--;
	}
	function handleDrop(event: DragEvent): void {
		event.preventDefault();
		dragDepth = 0;
		setFiles(event.dataTransfer?.files ?? null);
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}

	function fileGlyph(file: File) {
		const t = file.type;
		if (t.startsWith('image/')) return ImageIcon;
		if (t.startsWith('video/')) return FileVideoIcon;
		if (t.startsWith('audio/')) return FileAudioIcon;
		if (t === 'application/pdf') return FilePdfIcon;
		if (t.startsWith('text/') || /(json|xml|csv|md)/.test(t)) return FileTextIcon;
		if (/(zip|tar|rar|7z|gzip|compressed)/.test(t)) return FileZipIcon;
		return FileIcon;
	}

	function thumbFor(file: File): string | undefined {
		void thumbVersion;
		return thumbCache.get(file);
	}

	function slideFade(node: HTMLElement) {
		const cs = getComputedStyle(node);
		const h = node.offsetHeight;
		const pt = parseFloat(cs.paddingTop);
		const pb = parseFloat(cs.paddingBottom);
		return {
			duration: 240,
			easing: cubicOut,
			css: (t: number, u: number) =>
				`overflow: hidden;` +
				`height: ${t * h}px;` +
				`padding-top: ${t * pt}px;` +
				`padding-bottom: ${t * pb}px;` +
				`opacity: ${t};` +
				`transform: translateX(${u * -8}px);`
		};
	}

	let zoneIconSize = $derived(
		size === 'xl' ? 40 :
		size === 'large' ? 36 :
		size === 'small' ? 24 :
		size === 'mini' ? 20 : 32
	);

	let hasFiles = $derived(files.length > 0);
	let showFooterRow = $derived(
		!buttonOnly && hasFiles && (clearable || !!footer)
	);
</script>

{#if buttonOnly}
	<div
		class={cn(
			'upload',
			'upload--button-only',
			`upload--${variant}`,
			`upload--size-${size}`,
			disabled && 'upload--disabled',
			className
		)}
		style:--c={triplet}
		style:--dp={dragTween.current}
		style={userStyle}
		data-testid="upload"
	>
		<button
			type="button"
			class="upload__zone upload__zone--button"
			{disabled}
			data-drag-over={dragOver ? 'true' : undefined}
			onclick={() => inputEl?.click()}
			ondragenter={handleDragEnter}
			ondragover={(e) => e.preventDefault()}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			use:rippleAction={{ disabled, solidBg: false }}
		>
			<span class="upload__zone-bg" aria-hidden="true"></span>
			<span class="upload__zone-content">
				{#if children}
					{@render children()}
				{:else}
					<UploadSimpleIcon size={zoneIconSize} weight="bold" />
					<span class="upload__label">{label}</span>
				{/if}
			</span>
		</button>
		<input
			bind:this={inputEl}
			class="upload__input"
			type="file"
			{accept}
			{multiple}
			{disabled}
			onchange={(e) => {
				const t = e.currentTarget as HTMLInputElement;
				setFiles(t.files);
				t.value = '';
			}}
		/>
		<span class="upload__sr" aria-live="polite">{liveMessage}</span>
	</div>
{:else}
	<div
		class={cn(
			'upload',
			'upload--field',
			`upload--${variant}`,
			`upload--size-${size}`,
			wide && 'upload--wide',
			fullWidth && 'upload--full-width',
			dragOver && 'upload--drag-over',
			disabled && 'upload--disabled',
			!!error && 'upload--has-error',
			hasFiles && 'upload--has-files',
			className
		)}
		style:--c={triplet}
		style:--dp={dragTween.current}
		style={userStyle}
		data-testid="upload"
		ondragenter={handleDragEnter}
		ondragover={(e) => e.preventDefault()}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="presentation"
		use:rippleAction={{ disabled, solidBg: false }}
	>
		<span class="upload__bg" aria-hidden="true"></span>

		{#if showList && hasFiles}
			<ul class="upload__list" transition:slide={{ duration: 280, easing: cubicOut }}>
				{#each files as file (file.name + file.size + file.lastModified)}
					<li class="upload__item" transition:slideFade>
						{#if item}
							{@render item({ file, remove: () => remove(file), thumbnail: thumbFor(file) })}
						{:else}
							{@const Glyph = fileGlyph(file)}
							{@const thumb = showThumbs ? thumbFor(file) : undefined}
							<span class="upload__item-thumb" aria-hidden="true">
								{#if thumb}
									<img class="upload__item-img" src={thumb} alt="" />
								{:else}
									<Glyph size={20} weight="duotone" />
								{/if}
							</span>
							<span class="upload__item-text">
								<span class="upload__item-name" title={file.name}>{file.name}</span>
								<span class="upload__item-size">{formatSize(file.size)}</span>
							</span>
							<button
								type="button"
								class="upload__item-remove"
								aria-label="Remove {file.name}"
								onclick={(e) => { e.stopPropagation(); remove(file); }}
							>
								<XIcon size={12} weight="bold" />
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<button
			type="button"
			class="upload__hero"
			{disabled}
			aria-describedby={hint || error ? 'upload-meta' : undefined}
			data-drag-over={dragOver ? 'true' : undefined}
			onclick={() => inputEl?.click()}
		>
			{#if children}
				{@render children()}
			{:else}
				<span class="upload__plate" aria-hidden="true">
					<span class="upload__plate-ring"></span>
					<span class="upload__plate-inner">
						<UploadSimpleIcon size={zoneIconSize} weight="duotone" />
					</span>
				</span>
				<span class="upload__text">
					<span class="upload__label">{label}</span>
					<span class="upload__sublabel">{sublabel}</span>
				</span>
				{#if hint && !error}
					<span class="upload__hint" id="upload-meta">{hint}</span>
				{/if}
			{/if}
		</button>

		<input
			bind:this={inputEl}
			class="upload__input"
			type="file"
			{accept}
			{multiple}
			{disabled}
			onchange={(e) => {
				const t = e.currentTarget as HTMLInputElement;
				setFiles(t.files);
				t.value = '';
			}}
		/>

		{#if error}
			<div id="upload-meta" class="upload__error" role="alert">{error}</div>
		{/if}

		{#if showFooterRow}
			<div class="upload__footer" transition:slide={{ duration: 280, easing: cubicOut }}>
				{#if footer}
					{@render footer({ files, totalSize, clear })}
				{:else}
					<span class="upload__count">
						<span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
						<span class="upload__dot" aria-hidden="true">·</span>
						<span class="upload__total">{formatSize(totalSize)}</span>
					</span>
					{#if clearable}
						<button type="button" class="upload__clear" onclick={(e) => { e.stopPropagation(); clear(); }}>
							<TrashIcon size={12} weight="bold" />
							<span class="upload__clear-label">Clear all</span>
						</button>
					{/if}
				{/if}
			</div>
		{/if}

		<span class="upload__sr" aria-live="polite">{liveMessage}</span>
	</div>
{/if}

<style>
	:where(.upload) {
		--c: var(--primary);
		--dp: 0;
		--upload-pad: 14px;
		--upload-radius: 16px;
		--upload-hero-pad-y: 28px;
		--upload-hero-pad-x: 18px;
		--upload-label-size: 0.9rem;

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
		transition: padding 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload--field > * { min-width: 0; }

	/* Spacing between siblings via margin (not flex gap) — svelte/slide animates margin-bottom in lockstep with height, so no jump on unmount. */
	.upload--field > .upload__list { margin-block-end: var(--upload-pad); }
	.upload--field > .upload__hero:has(~ .upload__error),
	.upload--field > .upload__hero:has(~ .upload__footer) { margin-block-end: var(--upload-pad); }
	.upload--field > .upload__error:has(~ .upload__footer) { margin-block-end: var(--upload-pad); }

	/*
	 * Ripple — subtle accent wave under the content, clipped just inside the
	 * dashed/border-bg so it doesn't bleed onto the field's edge. Opacity is
	 * intentionally low; mix-blend-mode keeps it readable on both themes.
	 */
	.upload--field :global(.vs-ripple__layer) {
		inset: 2px;
		z-index: 1;
		border-radius: calc(var(--upload-radius) - 2px);
		opacity: 0.08;
		mix-blend-mode: multiply;
	}
	:global([data-theme='dark']) .upload--field :global(.vs-ripple__layer) {
		opacity: 0.12;
		mix-blend-mode: screen;
	}
	.upload--field.upload--wide { max-width: 480px; }
	.upload--field.upload--full-width { max-width: none; }

	:where(.upload--size-xl)    { --upload-radius: 22px; --upload-pad: 18px; --upload-hero-pad-y: 38px; --upload-hero-pad-x: 22px; --upload-label-size: 1rem; }
	:where(.upload--size-large) { --upload-radius: 18px; --upload-pad: 16px; --upload-hero-pad-y: 32px; --upload-hero-pad-x: 20px; --upload-label-size: 0.95rem; }
	:where(.upload--size-small) { --upload-radius: 14px; --upload-pad: 10px; --upload-hero-pad-y: 20px; --upload-hero-pad-x: 14px; --upload-label-size: 0.82rem; }
	:where(.upload--size-mini)  { --upload-radius: 12px; --upload-pad: 8px;  --upload-hero-pad-y: 14px; --upload-hero-pad-x: 12px; --upload-label-size: 0.74rem; }

	.upload__bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		border-radius: inherit;
		background: rgb(var(--c) / calc(0.05 + 0.06 * var(--dp)));
		transition: background-color 220ms cubic-bezier(0.4, 0, 0.2, 1);
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

	.upload--has-error.upload--default .upload__bg,
	.upload--has-error.upload--border .upload__bg {
		border-color: rgb(var(--danger) / 0.6);
	}

	:where(.upload--drag-over) { transform: translateY(-1px); }

	/* Hero — the click target. Always vertical: plate above text. Sizes/paddings/colors animate. */
	.upload__hero {
		position: relative;
		z-index: 2;
		flex: 1 1 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
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
			flex-basis 280ms cubic-bezier(0.4, 0, 0.2, 1),
			padding 280ms cubic-bezier(0.4, 0, 0.2, 1),
			gap 280ms cubic-bezier(0.4, 0, 0.2, 1),
			font-size 280ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 240ms cubic-bezier(0.4, 0, 0.2, 1),
			border-color 240ms cubic-bezier(0.4, 0, 0.2, 1),
			border-radius 280ms cubic-bezier(0.4, 0, 0.2, 1);
		box-sizing: border-box;
	}
	.upload__hero:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.upload__plate {
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
			width 280ms cubic-bezier(0.4, 0, 0.2, 1),
			height 280ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload--size-xl    .upload__plate { --plate-size: 68px; }
	.upload--size-large .upload__plate { --plate-size: 60px; }
	.upload--size-small .upload__plate { --plate-size: 44px; }
	.upload--size-mini  .upload__plate { --plate-size: 36px; }

	.upload__plate-ring {
		position: absolute;
		inset: -6px;
		border-radius: 50%;
		background: rgb(var(--c) / calc(0.08 + 0.08 * var(--dp)));
		transform: scale(calc(0.9 + 0.1 * var(--dp)));
		transition:
			background-color 240ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}
	.upload__plate-inner {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: rgb(var(--c) / calc(0.16 + 0.1 * var(--dp)));
		transition: background-color 240ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__hero[data-drag-over='true'] .upload__plate {
		transform: translateY(-3px);
	}

	.upload__text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 0;
		max-width: 100%;
		transition: gap 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__label {
		font-size: var(--upload-label-size);
		font-weight: 600;
		line-height: 1.3;
		color: rgb(var(--text));
		max-width: 100%;
		text-wrap: balance;
		overflow-wrap: anywhere;
		transition: font-size 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__sublabel {
		font-size: calc(var(--upload-label-size) * 0.85);
		opacity: 0.55;
		color: rgb(var(--text));
		max-width: 100%;
		transition:
			font-size 280ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__hint {
		display: inline-block;
		margin-top: 6px;
		padding: 3px 10px;
		font-size: 0.7rem;
		font-weight: 500;
		color: rgb(var(--c));
		background: rgb(var(--c) / 0.1);
		border-radius: 50vmax;
		max-width: 100%;
		overflow-wrap: anywhere;
		text-align: center;
		opacity: 1;
		transform: scale(1);
		transform-origin: top center;
		transition:
			opacity 280ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1),
			margin-top 280ms cubic-bezier(0.4, 0, 0.2, 1),
			max-height 280ms cubic-bezier(0.4, 0, 0.2, 1),
			padding 280ms cubic-bezier(0.4, 0, 0.2, 1);
		max-height: 60px;
		overflow: hidden;
	}

	.upload__error {
		flex: 1 1 100%;
		position: relative;
		z-index: 2;
		padding: 0 4px;
		color: rgb(var(--danger));
		font-size: 0.78rem;
	}

	.upload__input { display: none; }

	.upload--disabled .upload__hero { cursor: not-allowed; }
	:where(.upload--disabled) { opacity: 0.6; }

	/* List */
	.upload__list {
		flex: 1 1 100%;
		position: relative;
		z-index: 2;
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 280px;
		overflow-y: auto;
		min-width: 0;
	}

	.upload__item {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		padding: 6px 8px 6px 6px;
		border-radius: 10px;
		font-size: 0.85rem;
		min-width: 0;
		transition:
			background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__item:hover { background: rgb(var(--c) / 0.1); }

	.upload__item-thumb {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: rgb(var(--c) / 0.14);
		color: rgb(var(--c));
		overflow: hidden;
		flex: none;
	}
	.upload__item-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.upload__item-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 2px;
	}
	.upload__item-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}
	.upload__item-size {
		font-size: 0.72rem;
		opacity: 0.6;
		font-variant-numeric: tabular-nums;
	}

	.upload__item-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 24px;
		height: 24px;
		background: transparent;
		border: 0;
		border-radius: 6px;
		color: inherit;
		cursor: pointer;
		opacity: 0.55;
		transition:
			background-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
			color 180ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 180ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__item-remove:hover {
		opacity: 1;
		background: rgb(var(--danger) / 0.15);
		color: rgb(var(--danger));
	}
	.upload__item-remove:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
		opacity: 1;
	}

	/* Footer */
	.upload__footer {
		flex: 1 1 100%;
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
		padding-top: 10px;
		border-top: 1px solid rgb(var(--c) / 0.12);
		font-size: 0.78rem;
		color: rgb(var(--text));
	}
	.upload__count {
		display: inline-flex;
		gap: 6px;
		min-width: 0;
		opacity: 0.7;
		flex-wrap: wrap;
	}
	.upload__dot { opacity: 0.5; }
	.upload__total { font-variant-numeric: tabular-nums; }

	.upload__clear {
		--sa-color: var(--danger);
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		background: rgb(var(--danger) / 0.1);
		color: rgb(var(--danger));
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-size: 0.74rem;
		font-weight: 500;
		cursor: pointer;
		flex: none;
		transition:
			background-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 180ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload__clear:hover {
		background: rgb(var(--danger) / 0.18);
		transform: translateY(-1px);
	}
	.upload__clear:focus-visible {
		outline: 2px solid rgb(var(--danger) / 0.6);
		outline-offset: 2px;
	}

	/*
	 * With files: hero stays vertical (plate above text) but compresses —
	 * smaller padding, smaller plate, lighter font, hint collapses.
	 * Layout-wise it sits below the list (DOM order) and wraps; on wider
	 * containers it shrinks to a fixed-width side column next to the list.
	 */
	.upload--has-files .upload__hero {
		gap: 6px;
		padding: 12px 12px;
		font-size: calc(var(--upload-label-size) * 0.92);
		background: rgb(var(--c) / 0.06);
		border-radius: 10px;
	}
	.upload--has-files .upload__hero:hover { background: rgb(var(--c) / 0.1); }
	.upload--has-files .upload__plate { --plate-size: 38px; }
	.upload--has-files .upload__text { gap: 1px; }
	.upload--has-files .upload__label {
		font-size: calc(var(--upload-label-size) * 0.92);
	}
	.upload--has-files .upload__sublabel {
		font-size: calc(var(--upload-label-size) * 0.78);
	}
	.upload--has-files .upload__hint {
		opacity: 0;
		transform: scale(0.92);
		max-height: 0;
		margin-top: 0;
		padding-top: 0;
		padding-bottom: 0;
	}

	@container upload (min-width: 460px) {
		.upload--has-files .upload__list {
			flex: 1 1 60%;
			margin-block-end: 0;
			margin-inline-end: var(--upload-pad);
		}
		.upload--has-files .upload__hero {
			flex: 0 0 150px;
			align-self: stretch;
			padding: 14px 10px;
			background: rgb(var(--c) / 0.05);
			border: 1px dashed rgb(var(--c) / 0.3);
			border-radius: 10px;
			margin-block-end: var(--upload-pad);
		}
	}

	/* Tighter densities on narrow */
	@container upload (max-width: 320px) {
		.upload__item-thumb { width: 30px; height: 30px; }
		.upload__item { gap: 8px; padding: 5px 6px 5px 5px; }
		.upload__total, .upload__dot { display: none; }
	}

	/* button-only — pill button, no field chrome */
	.upload--button-only .upload__zone--button {
		--sa-color: var(--c);
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		max-width: 100%;
		padding: 10px 16px;
		background: transparent;
		color: rgb(var(--c));
		border: 0;
		border-radius: var(--upload-radius);
		font: inherit;
		font-size: var(--upload-label-size);
		cursor: pointer;
		transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.upload--button-only .upload__zone-content {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		min-width: 0;
		max-width: 100%;
		pointer-events: none;
	}
	.upload--button-only .upload__zone-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		border-radius: inherit;
		background: rgb(var(--c) / calc(0.1 + 0.08 * var(--dp)));
		pointer-events: none;
	}
	.upload--button-only .upload__zone--button { position: relative; isolation: isolate; }
	.upload--button-only .upload__zone--button:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	.upload--button-only .upload__zone--button:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
	.upload--button-only .upload__label {
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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

	.upload__list::-webkit-scrollbar { width: 6px; }
	.upload__list::-webkit-scrollbar-thumb {
		background: rgb(var(--c) / 0.25);
		border-radius: 3px;
	}
</style>
