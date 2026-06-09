import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { validateFiles, type UploadError } from './upload';

export type UploadMessages = {
	added: (file: File) => string;
	addedMany: (count: number) => string;
	removed: (file: File) => string;
	cleared: (count: number) => string;
};

const defaultMessages: UploadMessages = {
	added: (f) => `${f.name} added`,
	addedMany: (n) => `${n} files added`,
	removed: (f) => `${f.name} removed`,
	cleared: (n) => `${n} files removed`
};

export type UploadControllerOptions = {
	getFiles: () => File[];
	setFilesValue: (files: File[]) => void;
	multiple: () => boolean;
	disabled: () => boolean;
	accept: () => string | undefined;
	maxSize: () => number | undefined;
	maxFiles: () => number | undefined;
	onValueChange?: (files: File[]) => void;
	onerror?: (errors: UploadError[]) => void;
	messages?: () => Partial<UploadMessages> | undefined;
};

/** Shared file-selection + drag controller behind Upload. */
export class UploadController {
	#opts: UploadControllerOptions;
	#ids = new WeakMap<File, number>();
	#seq = 0;
	dragDepth = $state(0);
	liveMessage = $state('');
	dragTween = new Tween(0, { duration: 220, easing: cubicOut });

	constructor(opts: UploadControllerOptions) {
		this.#opts = opts;
	}

	get dragOver(): boolean {
		return !this.#opts.disabled() && this.dragDepth > 0;
	}

	#text(): UploadMessages {
		return { ...defaultMessages, ...this.#opts.messages?.() };
	}

	/** Stable per-File id so identical-metadata files animate independently. */
	id(file: File): number {
		let id = this.#ids.get(file);
		if (id === undefined) {
			id = this.#seq++;
			this.#ids.set(file, id);
		}
		return id;
	}

	#announce(message: string): void {
		this.liveMessage = '';
		queueMicrotask(() => (this.liveMessage = message));
	}

	setFiles(list: FileList | File[] | null): void {
		if (!list || this.#opts.disabled()) return;
		const arr = Array.from(list);
		const current = this.#opts.getFiles();
		const { keep, errors } = validateFiles(arr, {
			accept: this.#opts.accept(),
			maxSize: this.#opts.maxSize(),
			maxFiles: this.#opts.maxFiles(),
			multiple: this.#opts.multiple(),
			currentCount: current.length
		});
		if (errors.length) this.#opts.onerror?.(errors);
		if (keep.length === 0) return;
		const next = this.#opts.multiple() ? [...current, ...keep] : keep.slice(0, 1);
		this.#opts.setFilesValue(next);
		const t = this.#text();
		this.#announce(keep.length === 1 ? t.added(keep[0]) : t.addedMany(keep.length));
		this.#opts.onValueChange?.(next);
	}

	remove(file: File): void {
		const next = this.#opts.getFiles().filter((f) => f !== file);
		this.#opts.setFilesValue(next);
		this.#announce(this.#text().removed(file));
		this.#opts.onValueChange?.(next);
	}

	clear(): void {
		const count = this.#opts.getFiles().length;
		this.#opts.setFilesValue([]);
		this.#announce(this.#text().cleared(count));
		this.#opts.onValueChange?.([]);
	}

	handleDragEnter(event: DragEvent): void {
		event.preventDefault();
		if (this.#opts.disabled()) return;
		this.dragDepth++;
	}

	handleDragLeave(): void {
		this.dragDepth = Math.max(0, this.dragDepth - 1);
	}

	handleDrop(event: DragEvent): void {
		event.preventDefault();
		this.dragDepth = 0;
		this.setFiles(event.dataTransfer?.files ?? null);
	}

	/** Window dragend/drop reset; returns a cleanup to call from an `$effect`. */
	listenWindowReset(): () => void {
		const reset = () => (this.dragDepth = 0);
		window.addEventListener('dragend', reset);
		window.addEventListener('drop', reset);
		return () => {
			window.removeEventListener('dragend', reset);
			window.removeEventListener('drop', reset);
		};
	}
}
