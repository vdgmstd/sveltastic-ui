import type { AvatarGroupContext, AvatarRegistration } from './group';

/** Image load lifecycle: `loading` until verified, `loaded` on success, `error` on failure. */
export type AvatarLoadingStatus = 'loading' | 'loaded' | 'error';

type CrossOrigin = '' | 'anonymous' | 'use-credentials' | null | undefined;

export type AvatarRootConfig = {
	getStatus: () => AvatarLoadingStatus;
	setStatusProp: (status: AvatarLoadingStatus) => void;
	getDelayMs: () => number;
	getOnLoadingStatusChange: () => ((status: AvatarLoadingStatus) => void) | undefined;
	getRef: () => HTMLElement | null;
	group: AvatarGroupContext | undefined;
};

/** Root state for an Avatar: owns the loading-status machine, group registration, and shared part flags. */
export class AvatarRootState {
	#cfg: AvatarRootConfig;
	#registration = $state<ReturnType<AvatarGroupContext['register']>>();

	/** Icons-strip placements registered by mounted Avatar.Icons parts (drives Root isolation/clearance hooks). */
	iconsPlacements = $state<('vertical' | 'horizontal')[]>([]);

	constructor(cfg: AvatarRootConfig) {
		this.#cfg = cfg;
	}

	get status(): AvatarLoadingStatus {
		return this.#cfg.getStatus();
	}

	get delayMs(): number {
		return this.#cfg.getDelayMs();
	}

	get hasIcons(): boolean {
		return this.iconsPlacements.length > 0;
	}

	get hasVerticalIcons(): boolean {
		return this.iconsPlacements.includes('vertical');
	}

	get hasHorizontalIcons(): boolean {
		return this.iconsPlacements.includes('horizontal');
	}

	setStatus(status: AvatarLoadingStatus): void {
		if (this.status === status) return;
		this.#cfg.setStatusProp(status);
		this.#cfg.getOnLoadingStatusChange()?.(status);
	}

	/** Creates an off-DOM probe Image; flips status on load (after delayMs) / error. Returns a cleanup that cancels every late path. */
	loadImage(src: string, crossorigin?: CrossOrigin, referrerpolicy?: ReferrerPolicy): () => void {
		if (this.status === 'loaded') return () => {};
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const image = new Image();
		image.src = src;
		if (crossorigin !== undefined) image.crossOrigin = crossorigin;
		if (referrerpolicy) image.referrerPolicy = referrerpolicy;
		this.setStatus('loading');
		image.onload = () => {
			if (cancelled) return;
			timer = setTimeout(() => {
				if (!cancelled) this.setStatus('loaded');
			}, this.delayMs);
		};
		image.onerror = () => {
			if (!cancelled) this.setStatus('error');
		};
		return () => {
			cancelled = true;
			if (timer !== undefined) clearTimeout(timer);
			image.onload = image.onerror = null;
			image.src = '';
		};
	}

	registerIcons(placement: 'vertical' | 'horizontal'): () => void {
		const token: 'vertical' | 'horizontal' = placement;
		this.iconsPlacements = [...this.iconsPlacements, token];
		return () => {
			let removed = false;
			this.iconsPlacements = this.iconsPlacements.filter((p) => {
				if (!removed && p === token) {
					removed = true;
					return false;
				}
				return true;
			});
		};
	}

	registerGroup(): (() => void) | undefined {
		const node = this.#cfg.getRef();
		if (!this.#cfg.group || !node) return undefined;
		const reg = this.#cfg.group.register(node);
		this.#registration = reg;
		return () => {
			reg.unregister();
			this.#registration = undefined;
		};
	}

	get groupState(): AvatarRegistration | undefined {
		return this.#registration?.state();
	}

	get inGroup(): boolean {
		return !!this.#registration;
	}
}
