/**
 * Subscribe to every event that can shift a fixed-positioned panel relative to its anchor.
 * Scroll runs reposition synchronously (no rAF) so the panel stays glued during fast scroll;
 * resize and size-observer events are rAF-throttled.
 * Returns a cleanup function — call it on close / destroy.
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
