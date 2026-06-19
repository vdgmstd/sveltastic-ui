import type { Action } from 'svelte/action';

export type OverlayScrollbarOptions = {
	/** Ms of scroll inactivity before the floating thumb fades out. */
	hideDelay?: number;
	/** Minimum thumb length in px. */
	minThumb?: number;
};

const DEFAULTS = { hideDelay: 900, minThumb: 28 };

/**
 * Turns an `overflow:auto` element into an OVERLAY-scrolled one: the native scrollbar is hidden
 * (zero reserved layout width) and a thin thumb floats over the content, tracking scroll directly
 * via `transform` (no spring lag). The thumb is appended to the host's positioned offset parent.
 *
 * The host must scroll itself (`overflow-y:auto`) and live inside a positioned ancestor (the kit's
 * `.popover` satisfies this). Native-bar hiding uses `scrollbar-width:none` (Firefox + modern
 * Chromium/Safari); legacy WebKit also needs a `::-webkit-scrollbar{display:none}` rule on the host.
 */
export const overlayScrollbar: Action<HTMLElement, OverlayScrollbarOptions | undefined> = (
	host,
	options
) => {
	let opts = { ...DEFAULTS, ...options };
	const ac = new AbortController();
	const { signal } = ac;

	const prevScrollbarWidth = host.style.scrollbarWidth;
	host.style.scrollbarWidth = 'none';

	const thumb = document.createElement('div');
	thumb.setAttribute('aria-hidden', 'true');
	Object.assign(thumb.style, {
		position: 'absolute',
		top: '0',
		left: '0',
		width: '6px',
		borderRadius: '999px',
		background: 'rgb(var(--text, 15 23 42) / 0.32)',
		opacity: '0',
		transition: 'opacity 160ms cubic-bezier(0.4, 0, 0.2, 1), background 140ms cubic-bezier(0.4, 0, 0.2, 1)',
		pointerEvents: 'auto',
		cursor: 'default',
		touchAction: 'none',
		willChange: 'transform',
		zIndex: '1'
	} satisfies Partial<CSSStyleDeclaration>);

	let mounted = false;
	function mount(): void {
		const parent = (host.offsetParent as HTMLElement | null) ?? host.parentElement;
		if (!parent || mounted) return;
		parent.appendChild(thumb);
		mounted = true;
	}

	let thumbH = 0;
	let overflow = 0;
	let trackH = 0;

	function layout(): void {
		mount();
		const sh = host.scrollHeight;
		const ch = host.clientHeight;
		overflow = sh - ch;
		if (overflow <= 1) {
			thumb.style.opacity = '0';
			thumb.style.display = 'none';
			return;
		}
		thumb.style.display = 'block';
		trackH = ch;
		thumbH = Math.max(opts.minThumb, (ch / sh) * trackH);
		thumb.style.height = `${thumbH}px`;
		thumb.style.top = `${host.offsetTop}px`;
		thumb.style.left = `${host.offsetLeft + host.clientWidth - 6 - 2}px`;
		position();
	}

	function position(): void {
		if (overflow <= 1) return;
		const y = (host.scrollTop / overflow) * (trackH - thumbH);
		thumb.style.transform = `translateY(${y}px)`;
	}

	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let dragging = false;
	function show(): void {
		if (overflow > 1) thumb.style.opacity = '1';
	}
	function scheduleHide(): void {
		if (hideTimer) clearTimeout(hideTimer);
		if (dragging) return;
		hideTimer = setTimeout(() => {
			if (!dragging && !host.matches(':hover')) thumb.style.opacity = '0';
		}, opts.hideDelay);
	}

	let raf = 0;
	function onScroll(): void {
		show();
		if (!raf) raf = requestAnimationFrame(() => { raf = 0; position(); });
		scheduleHide();
	}

	host.addEventListener('scroll', onScroll, { passive: true, signal });
	host.addEventListener('pointerenter', () => { show(); scheduleHide(); }, { signal });
	host.addEventListener('pointerleave', scheduleHide, { signal });

	// Thumb drag — pointer maps 1:1 onto the host's scrollable range.
	let dragStartY = 0;
	let dragStartScroll = 0;
	let dragRaf = 0;
	let pendingScroll = 0;
	function applyDrag(): void {
		dragRaf = 0;
		host.scrollTop = pendingScroll;
	}
	thumb.addEventListener('pointerdown', (e) => {
		if (e.button !== 0 || overflow <= 1) return;
		e.preventDefault();
		e.stopPropagation();
		dragging = true;
		dragStartY = e.clientY;
		dragStartScroll = host.scrollTop;
		thumb.setPointerCapture(e.pointerId);
		thumb.style.background = 'rgb(var(--text, 15 23 42) / 0.6)';
	}, { signal });
	thumb.addEventListener('pointermove', (e) => {
		if (!dragging) return;
		const range = trackH - thumbH;
		if (range <= 0) return;
		pendingScroll = dragStartScroll + ((e.clientY - dragStartY) / range) * overflow;
		if (!dragRaf) dragRaf = requestAnimationFrame(applyDrag);
	}, { signal });
	function endDrag(e: PointerEvent): void {
		if (!dragging) return;
		dragging = false;
		thumb.releasePointerCapture?.(e.pointerId);
		thumb.style.background = 'rgb(var(--text, 15 23 42) / 0.32)';
		scheduleHide();
	}
	thumb.addEventListener('pointerup', endDrag, { signal });
	thumb.addEventListener('pointercancel', endDrag, { signal });

	const ro = new ResizeObserver(layout);
	ro.observe(host);
	const mo = new MutationObserver(layout);
	mo.observe(host, { childList: true, subtree: true });

	queueMicrotask(layout);

	return {
		update(next?: OverlayScrollbarOptions) {
			opts = { ...DEFAULTS, ...next };
			layout();
		},
		destroy() {
			ac.abort();
			ro.disconnect();
			mo.disconnect();
			if (raf) cancelAnimationFrame(raf);
			if (dragRaf) cancelAnimationFrame(dragRaf);
			if (hideTimer) clearTimeout(hideTimer);
			host.style.scrollbarWidth = prevScrollbarWidth;
			thumb.remove();
		}
	};
};
