import { reducedMotion } from '../../state/reducedMotion.svelte';

export type AlertVariant = 'relief' | 'gradient';

type AlertRootConfig = {
	getOpen: () => boolean;
	setOpenProp: (v: boolean) => void;
	getCollapsed: () => boolean | undefined;
	setCollapsedProp: (v: boolean) => void;
	getOnOpenChange: () => ((open: boolean) => void) | undefined;
	getOnOpenChangeComplete: () => ((open: boolean) => void) | undefined;
	getOnCollapsedChange: () => ((collapsed: boolean) => void) | undefined;
};

/** Shared Alert state — proxies the bindable open/collapsed props, owns the content id, and tracks composed parts. */
export class AlertRootState {
	readonly contentId: string;
	#dismissibleCount = $state(0);
	#progressCount = $state(0);

	constructor(
		private cfg: AlertRootConfig,
		uid: string
	) {
		this.contentId = `alert-content-${uid}`;
	}

	get open(): boolean {
		return this.cfg.getOpen();
	}

	get hasCollapse(): boolean {
		return typeof this.cfg.getCollapsed() === 'boolean';
	}

	get isCollapsed(): boolean {
		return this.cfg.getCollapsed() === true;
	}

	get hasDismiss(): boolean {
		return this.#dismissibleCount > 0;
	}

	get hasProgress(): boolean {
		return this.#progressCount > 0;
	}

	get isInteractive(): boolean {
		return this.hasCollapse || this.hasDismiss || this.hasProgress;
	}

	get motionDuration(): number {
		return reducedMotion.current ? 0 : 250;
	}

	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.cfg.setOpenProp(next);
		this.cfg.getOnOpenChange()?.(next);
	}

	completeOpen(next: boolean): void {
		this.cfg.getOnOpenChangeComplete()?.(next);
	}

	toggleCollapse(): void {
		if (!this.hasCollapse) return;
		const next = !this.cfg.getCollapsed();
		this.cfg.setCollapsedProp(next);
		this.cfg.getOnCollapsedChange()?.(next);
	}

	registerDismiss(): () => void {
		this.#dismissibleCount += 1;
		return () => {
			this.#dismissibleCount -= 1;
		};
	}

	registerProgress(): () => void {
		this.#progressCount += 1;
		return () => {
			this.#progressCount -= 1;
		};
	}
}
