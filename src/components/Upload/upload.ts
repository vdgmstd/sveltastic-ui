import {
	FileIcon,
	ImageIcon,
	FilePdfIcon,
	FileTextIcon,
	FileVideoIcon,
	FileAudioIcon,
	FileZipIcon
} from 'phosphor-svelte';

export type UploadErrorReason = 'size' | 'count' | 'type';

export type UploadError = {
	file: File;
	reason: UploadErrorReason;
	max?: number;
};

export type ValidateConstraints = {
	accept?: string;
	maxSize?: number;
	maxFiles?: number;
	multiple: boolean;
	currentCount: number;
};

function matchesAccept(file: File, pattern: string): boolean {
	const tokens = pattern
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (tokens.length === 0) return true;
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return tokens.some((t) => {
		if (t.startsWith('.')) return name.endsWith(t);
		if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1));
		return type === t;
	});
}

/** Filters an incoming list against accept / size / count constraints, returning kept files and rejection reasons. */
export function validateFiles(
	input: File[],
	c: ValidateConstraints
): { keep: File[]; errors: UploadError[] } {
	const errors: UploadError[] = [];
	const keep: File[] = [];
	const room = c.maxFiles !== undefined ? Math.max(0, c.maxFiles - c.currentCount) : Infinity;
	const slot = c.multiple ? room : 1;

	for (const f of input) {
		if (c.accept && !matchesAccept(f, c.accept)) {
			errors.push({ file: f, reason: 'type' });
			continue;
		}
		if (c.maxSize !== undefined && f.size > c.maxSize) {
			errors.push({ file: f, reason: 'size', max: c.maxSize });
			continue;
		}
		if (keep.length >= slot) {
			errors.push({ file: f, reason: 'count', max: c.maxFiles });
			continue;
		}
		keep.push(f);
	}
	return { keep, errors };
}

export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function fileGlyph(file: File) {
	const t = file.type;
	if (t.startsWith('image/')) return ImageIcon;
	if (t.startsWith('video/')) return FileVideoIcon;
	if (t.startsWith('audio/')) return FileAudioIcon;
	if (t === 'application/pdf') return FilePdfIcon;
	if (t.startsWith('text/') || /(json|xml|csv|md)/.test(t)) return FileTextIcon;
	if (/(zip|tar|rar|7z|gzip|compressed)/.test(t)) return FileZipIcon;
	return FileIcon;
}

/** Object-URL cache for image thumbnails — revokes URLs when files leave the set and on destroy. */
export class ThumbnailCache {
	#cache = new Map<File, string>();

	/** Syncs the cache to the given files, returns `true` when the URL set changed. */
	sync(files: File[]): boolean {
		let changed = false;
		for (const f of files) {
			if (!this.#cache.has(f) && f.type.startsWith('image/')) {
				this.#cache.set(f, URL.createObjectURL(f));
				changed = true;
			}
		}
		for (const [f, url] of this.#cache) {
			if (!files.includes(f)) {
				URL.revokeObjectURL(url);
				this.#cache.delete(f);
				changed = true;
			}
		}
		return changed;
	}

	get(file: File): string | undefined {
		return this.#cache.get(file);
	}

	destroy(): void {
		for (const url of this.#cache.values()) URL.revokeObjectURL(url);
		this.#cache.clear();
	}
}
