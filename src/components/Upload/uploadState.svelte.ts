import type { Color, Size } from '../../types';
import { rgbTriplet } from '../../utils/color';
import { UploadController, type UploadMessages } from './upload.svelte';
import { ThumbnailCache, type UploadError } from './upload';

export type UploadRootConfig = {
	getFiles: () => File[];
	setFilesValue: (files: File[]) => void;
	multiple: () => boolean;
	disabled: () => boolean;
	accept: () => string | undefined;
	maxSize: () => number | undefined;
	maxFiles: () => number | undefined;
	size: () => Size;
	color: () => Color;
	thumbnails: () => boolean | undefined;
	listHidden: () => boolean;
	hint: () => string | undefined;
	error: () => string | undefined;
	clearable: () => boolean;
	buttonOnly: () => boolean;
	countLabel: () => (n: number) => string;
	clearLabel: () => string;
	removeLabel: () => (file: File) => string;
	onValueChange?: (files: File[]) => void;
	onerror?: (errors: UploadError[]) => void;
	messages?: () => Partial<UploadMessages> | undefined;
};

/** Root state for the Upload compound: owns the controller, thumbnail cache, ARIA ids, and shared derived bags. */
export class UploadRootState {
	#cfg: UploadRootConfig;
	#thumbCache = new ThumbnailCache();
	#thumbVersion = $state(0);
	readonly ctl: UploadController;
	readonly metaId: string;
	inputEl: HTMLInputElement | undefined = $state();

	constructor(cfg: UploadRootConfig, metaId: string) {
		this.#cfg = cfg;
		this.metaId = metaId;
		this.ctl = new UploadController({
			getFiles: cfg.getFiles,
			setFilesValue: cfg.setFilesValue,
			multiple: cfg.multiple,
			disabled: cfg.disabled,
			accept: cfg.accept,
			maxSize: cfg.maxSize,
			maxFiles: cfg.maxFiles,
			onValueChange: (v) => cfg.onValueChange?.(v),
			onerror: cfg.onerror,
			messages: cfg.messages
		});
	}

	get files(): File[] {
		return this.#cfg.getFiles();
	}
	get triplet(): string {
		return rgbTriplet(this.#cfg.color());
	}
	get size(): Size {
		return this.#cfg.size();
	}
	get disabled(): boolean {
		return this.#cfg.disabled();
	}
	get hint(): string | undefined {
		return this.#cfg.hint();
	}
	get error(): string | undefined {
		return this.#cfg.error();
	}
	get clearable(): boolean {
		return this.#cfg.clearable();
	}
	get buttonOnly(): boolean {
		return this.#cfg.buttonOnly();
	}
	get countText(): string {
		return this.#cfg.countLabel()(this.files.length);
	}
	get clearText(): string {
		return this.#cfg.clearLabel();
	}
	removeLabelFor(file: File): string {
		return this.#cfg.removeLabel()(file);
	}
	get hasFiles(): boolean {
		return this.files.length > 0;
	}
	get listHidden(): boolean {
		return this.#cfg.listHidden();
	}
	get totalSize(): number {
		return this.files.reduce((a, f) => a + f.size, 0);
	}
	get showThumbs(): boolean {
		return this.#cfg.thumbnails() ?? this.files.some((f) => f.type.startsWith('image/'));
	}
	get zoneIconSize(): number {
		const s = this.size;
		return s === 'xl' ? 40 : s === 'large' ? 36 : s === 'small' ? 24 : s === 'mini' ? 20 : 32;
	}
	get itemIconSize(): number {
		const s = this.size;
		return s === 'xl' ? 24 : s === 'large' ? 22 : s === 'small' ? 18 : s === 'mini' ? 16 : 20;
	}

	openPicker(): void {
		this.inputEl?.click();
	}

	thumbFor(file: File): string | undefined {
		void this.#thumbVersion;
		return this.#thumbCache.get(file);
	}

	/** Keeps the drag tween in lockstep with `dragOver`; call from an `$effect` in the Root. */
	syncDragTween(): void {
		this.ctl.dragTween.target = this.ctl.dragOver ? 1 : 0;
	}

	/** Re-syncs the thumbnail cache to the current files; call from an `$effect` in the Root. */
	syncThumbs(): void {
		if (this.#thumbCache.sync(this.files)) this.#thumbVersion++;
	}

	destroy(): void {
		this.#thumbCache.destroy();
	}
}
