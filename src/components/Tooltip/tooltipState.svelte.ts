import { rgbTriplet } from '../../utils/color';
import type { Color } from '../../types';
import type { TooltipPlacement, TooltipTrigger } from './context';
import type { PortalTarget } from '../../actions/portal';

let hoverQuery: MediaQueryList | undefined;

/**
 * True only for a pointer that can actually hover. Touch engines synthesise `mouseenter`/`mouseleave`
 * from a tap, which would otherwise open — and strand — the bubble. Queried lazily so the module stays SSR-safe.
 */
function pointerCanHover(): boolean {
	if (typeof window === 'undefined') return true;
	hoverQuery ??= window.matchMedia?.('(hover: hover)');
	return hoverQuery?.matches ?? true;
}

export type TooltipConfig = {
	/** Read the bindable `open` prop (controlled/uncontrolled both flow through it). */
	getOpen: () => boolean;
	/** Write the bindable `open` prop. */
	setOpenProp: (open: boolean) => void;
	readonly placement: TooltipPlacement;
	readonly trigger: TooltipTrigger;
	readonly delay: number;
	readonly interactive: boolean;
	readonly color: Color;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Shared Tooltip state: open (proxied to the bindable prop), the hover-intent timer, the anchor ref + ARIA id. */
export class TooltipRootState {
	/** Anchor used by `computeSidePosition` + `dismissibleLayer.anchor`; written by the Trigger. */
	triggerRef = $state<HTMLElement | null>(null);
	/** ARIA id linking the focusable trigger child to the live bubble. */
	bubbleId = $state<string | undefined>(undefined);
	pointerOnBubble = $state(false);
	/** Set by an optional `Tooltip.Portal` wrapper; consumed by `Tooltip.Content`. */
	portal = $state<{ target?: PortalTarget; disabled?: boolean; forceMount?: boolean }>({});

	private timer: number | undefined;

	constructor(private readonly cfg: TooltipConfig) {}

	get open(): boolean {
		return this.cfg.getOpen();
	}
	get placement(): TooltipPlacement {
		return this.cfg.placement;
	}
	get trigger(): TooltipTrigger {
		return this.cfg.trigger;
	}
	get interactive(): boolean {
		return this.cfg.interactive;
	}
	get color(): Color {
		return this.cfg.color;
	}
	get triplet(): string {
		return rgbTriplet(this.cfg.color);
	}

	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.cfg.setOpenProp(next);
		this.cfg.onOpenChange?.(next);
	}

	completeClose(): void {
		this.cfg.onOpenChangeComplete?.(false);
	}

	clearTimer(): void {
		if (this.timer === undefined) return;
		window.clearTimeout(this.timer);
		this.timer = undefined;
	}

	private show(): void {
		this.clearTimer();
		if (this.cfg.delay > 0) {
			this.timer = window.setTimeout(() => {
				this.setOpen(true);
				this.timer = undefined;
			}, this.cfg.delay);
		} else {
			this.setOpen(true);
		}
	}

	private hide(): void {
		this.clearTimer();
		if (this.cfg.interactive) {
			this.timer = window.setTimeout(() => {
				if (!this.pointerOnBubble) this.setOpen(false);
				this.timer = undefined;
			}, 150);
		} else {
			this.setOpen(false);
		}
	}

	/** Focus path — active on every device. */
	handleEnter = (): void => {
		if (this.cfg.trigger === 'hover') this.show();
	};
	handleLeave = (): void => {
		if (this.cfg.trigger === 'hover') this.hide();
	};
	/** Mouse path — inert where the pointer cannot hover, so a tap never opens the bubble. */
	handlePointerEnter = (): void => {
		if (pointerCanHover()) this.handleEnter();
	};
	handlePointerLeave = (): void => {
		if (pointerCanHover()) this.handleLeave();
	};
	handleClick = (): void => {
		if (this.cfg.trigger === 'click') this.setOpen(!this.open);
	};

	bubbleEnter = (): void => {
		if (!pointerCanHover()) return;
		this.pointerOnBubble = true;
		this.clearTimer();
	};
	bubbleLeave = (): void => {
		if (!pointerCanHover()) return;
		this.pointerOnBubble = false;
		if (this.cfg.trigger === 'hover') this.hide();
	};
}
