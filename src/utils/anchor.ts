/** Side of the anchor a panel sits on, with optional inline alignment. */
export type AnchorPlacement =
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'top'
	| 'top-start'
	| 'top-end';

/** Four-side placement for arrowed bubbles (Tooltip). */
export type SidePlacement = 'top' | 'right' | 'bottom' | 'left';

/** Persisted flip decision so a panel doesn't oscillate sides/alignment across reposition calls. */
export type AnchorFlipState = {
	side: 'top' | 'bottom' | null;
	align: 'start' | 'center' | 'end' | null;
};

export type AnchorResult = {
	x: number;
	y: number;
	placement: AnchorPlacement;
	triggerWidth: number;
};

/**
 * Subscribe to every event that can shift a fixed-positioned panel relative to its anchor.
 * Scroll runs reposition synchronously (no rAF) so the panel stays glued during fast scroll;
 * resize and size-observer events are rAF-throttled. Returns a cleanup to call on close / destroy.
 */
export function watchAnchor(anchor: Element, panel: Element, reposition: () => void): () => void {
	let frame: number | null = null;
	const schedule = (): void => {
		if (frame !== null) return;
		frame = requestAnimationFrame(() => {
			frame = null;
			reposition();
		});
	};

	window.addEventListener('scroll', reposition, { passive: true, capture: true });
	window.addEventListener('resize', schedule);

	const ro = new ResizeObserver(schedule);
	ro.observe(anchor);
	ro.observe(panel);

	reposition();

	return () => {
		if (frame !== null) cancelAnimationFrame(frame);
		window.removeEventListener('scroll', reposition, { capture: true });
		window.removeEventListener('resize', schedule);
		ro.disconnect();
	};
}

/**
 * Popover placement chain: flips side/alignment to fit the viewport, biased to stay put once chosen.
 * Mutates `flip` in place so callers keep one stable decision. Returns fixed-position viewport coords.
 */
export function computeAnchorPosition(
	trigger: HTMLElement,
	panel: HTMLElement,
	placement: AnchorPlacement,
	offset: number,
	flip: AnchorFlipState
): AnchorResult {
	const t = trigger.getBoundingClientRect();
	const pw = panel.offsetWidth;
	const ph = panel.offsetHeight;
	const vh = window.innerHeight;
	const vw = window.innerWidth;
	const margin = 8;

	const wantsTop = placement.startsWith('top');
	const wantsAlign: 'start' | 'center' | 'end' = placement.endsWith('-end')
		? 'end'
		: placement === 'top' || placement === 'bottom'
			? 'center'
			: 'start';

	const spaceBelow = vh - t.bottom - margin;
	const spaceAbove = t.top - margin;

	if (flip.side === null) {
		flip.side = wantsTop !== (spaceAbove < ph && spaceBelow > spaceAbove) ? 'top' : 'bottom';
	} else {
		const cur = flip.side === 'top' ? spaceAbove : spaceBelow;
		const opp = flip.side === 'top' ? spaceBelow : spaceAbove;
		if (cur < ph && opp > cur) flip.side = flip.side === 'top' ? 'bottom' : 'top';
	}

	const startFits = t.left + pw <= vw - margin;
	const endFits = t.right - pw >= margin;
	if (flip.align === null) {
		let initial = wantsAlign;
		if (initial === 'start' && !startFits && endFits) initial = 'end';
		else if (initial === 'end' && !endFits && startFits) initial = 'start';
		flip.align = initial;
	} else if (flip.align === 'start' && !startFits && endFits) {
		flip.align = 'end';
	} else if (flip.align === 'end' && !endFits && startFits) {
		flip.align = 'start';
	}

	const sideTop = flip.side === 'top';
	const align = flip.align;

	const y = sideTop ? t.top - ph - offset : t.bottom + offset;
	const x =
		align === 'end'
			? t.right - pw
			: align === 'center'
				? t.left + (t.width - pw) / 2
				: t.left;

	const alignKey = align === 'center' ? '' : `-${align}`;
	const resolved = `${sideTop ? 'top' : 'bottom'}${alignKey}` as AnchorPlacement;
	return { x, y, placement: resolved, triggerWidth: t.width };
}

/** Tooltip bubble placement: one of four sides, clamped into the viewport. Fixed-position coords. */
export function computeSidePosition(
	trigger: HTMLElement,
	bubble: HTMLElement,
	placement: SidePlacement,
	gap = 8
): { x: number; y: number } {
	const t = trigger.getBoundingClientRect();
	// Layout box (transform-immune, no sub-pixel scroll jitter) — matches computeAnchorPosition so the bubble stays glued like Menu.
	const bw = bubble.offsetWidth;
	const bh = bubble.offsetHeight;
	let x = 0;
	let y = 0;
	if (placement === 'top') {
		x = t.left + (t.width - bw) / 2;
		y = t.top - bh - gap;
	} else if (placement === 'bottom') {
		x = t.left + (t.width - bw) / 2;
		y = t.bottom + gap;
	} else if (placement === 'left') {
		x = t.left - bw - gap;
		y = t.top + (t.height - bh) / 2;
	} else {
		x = t.right + gap;
		y = t.top + (t.height - bh) / 2;
	}
	x = Math.max(8, Math.min(window.innerWidth - bw - 8, x));
	y = Math.max(8, Math.min(window.innerHeight - bh - 8, y));
	return { x, y };
}
