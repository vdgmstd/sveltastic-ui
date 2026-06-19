import { Spring } from 'svelte/motion';
import { rgbTriplet } from '../../utils/color';
import type { Color } from '../../types';
import type { PortalTarget } from '../../actions/portal';

export type DialogSize = 'small' | 'medium' | 'large' | 'fullscreen';
export type DialogAlign = 'center' | 'top' | 'start' | 'end' | 'bottom';
export type DialogRole = 'dialog' | 'alertdialog';

export type DialogConfig = {
	/** Read the bindable `open` prop (controlled/uncontrolled both flow through it). */
	getOpen: () => boolean;
	/** Write the bindable `open` prop. */
	setOpenProp: (open: boolean) => void;
	readonly size: DialogSize;
	readonly align: DialogAlign;
	readonly color: Color;
	readonly persistent: boolean;
	readonly role: DialogRole;
	readonly ariaLabel: string | undefined;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Shared Dialog state: open (proxied to the bindable prop) + the bounce spring + the ARIA id registry. */
export class DialogRootState {
	titleId = $state<string | undefined>(undefined);
	descriptionId = $state<string | undefined>(undefined);
	contentId = $state<string | undefined>(undefined);
	/** Set by an optional `Dialog.Portal` wrapper; `active` relocates the native `<dialog>` (default: in place). */
	portal = $state<{ active?: boolean; target?: PortalTarget; disabled?: boolean }>({});
	readonly rebound = new Spring(1, { stiffness: 0.35, damping: 0.45 });

	constructor(private readonly cfg: DialogConfig) {}

	get open(): boolean { return this.cfg.getOpen(); }
	get size(): DialogSize { return this.cfg.size; }
	get align(): DialogAlign { return this.cfg.align; }
	get persistent(): boolean { return this.cfg.persistent; }
	get role(): DialogRole { return this.cfg.role; }
	get ariaLabel(): string | undefined { return this.cfg.ariaLabel; }
	get triplet(): string { return rgbTriplet(this.cfg.color); }

	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.cfg.setOpenProp(next);
		this.cfg.onOpenChange?.(next);
	}

	completeClose(): void {
		this.cfg.onOpenChangeComplete?.(false);
	}

	pulse(): void {
		this.rebound.set(1.03, { instant: true });
		this.rebound.target = 1;
	}
}
