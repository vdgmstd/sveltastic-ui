const OWNED_PROPERTIES = ['overflow', 'padding-right', '--scrollbar-width'] as const;

const ALLOW_SELECTOR = '[data-scroll-lock-allow], dialog[open]';
const POPOVER_ALLOW_SELECTOR = `${ALLOW_SELECTOR}, [popover]:popover-open`;

let cachedAllowSelector: string | null = null;

function touchAllowSelector(): string {
	if (cachedAllowSelector === null) {
		try {
			document.querySelector(POPOVER_ALLOW_SELECTOR);
			cachedAllowSelector = POPOVER_ALLOW_SELECTOR;
		} catch {
			// `:popover-open` is a SyntaxError on WebKit < 17 — one throwing selector must not disable the blocker.
			cachedAllowSelector = ALLOW_SELECTOR;
		}
	}
	return cachedAllowSelector;
}

type OwnedDeclaration = { value: string; priority: string };

class ScrollLock {
	#count = 0;
	#priorProperties: Map<string, OwnedDeclaration> | null = null;
	#touchHandler: ((e: TouchEvent) => void) | null = null;
	#pendingRestore: number | null = null;
	#allowed = new Set<Element>();

	#gutterCompensation(): number {
		if (typeof window === 'undefined') return 0;
		// A coarse pointer has nothing to compensate: touch scrollbars are overlays that reserve no layout
		// space, and iOS reports the VISUAL viewport in innerWidth (bogus width while pinch-zoomed).
		if (window.matchMedia?.('(pointer: coarse)').matches) return 0;
		// Read via the string API: `scrollbar-gutter` is absent below Safari 17.4, where the camelCase
		// property is `undefined` and any string method on it throws.
		const gutter = getComputedStyle(document.documentElement).getPropertyValue('scrollbar-gutter');
		if (gutter.includes('stable')) return 0;
		return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
	}

	#apply(): void {
		const body = document.body;

		const prior = new Map<string, OwnedDeclaration>();
		for (const property of OWNED_PROPERTIES) {
			prior.set(property, {
				value: body.style.getPropertyValue(property),
				priority: body.style.getPropertyPriority(property)
			});
		}
		this.#priorProperties = prior;

		body.style.setProperty('overflow', 'hidden');

		const scrollbarWidth = this.#gutterCompensation();
		if (scrollbarWidth > 0) {
			const priorPad = parseFloat(getComputedStyle(body).paddingRight) || 0;
			body.style.setProperty('padding-right', `${priorPad + scrollbarWidth}px`);
			body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
		}

		const allowSelector = touchAllowSelector();
		this.#touchHandler = (e: TouchEvent): void => {
			if (e.touches.length > 1) return;
			const target = e.target instanceof Element ? e.target : null;
			if (!target) return;
			if (target.closest(allowSelector)) return;
			for (const el of this.#allowed) if (el.contains(target)) return;
			e.preventDefault();
		};
		document.addEventListener('touchmove', this.#touchHandler, { passive: false });
	}

	#release(): void {
		const body = document.body;
		if (this.#priorProperties) {
			for (const [property, { value, priority }] of this.#priorProperties) {
				if (value) body.style.setProperty(property, value, priority);
				else body.style.removeProperty(property);
			}
			this.#priorProperties = null;
		}
		this.#allowed.clear();
		if (this.#touchHandler) {
			document.removeEventListener('touchmove', this.#touchHandler);
			this.#touchHandler = null;
		}
	}

	/**
	 * Lock body scroll (ref-counted). Pass the scrollable layer to keep touch scrolling inside it; layers
	 * outside the DOM subtree (portaled popovers, toasts) opt in with a `data-scroll-lock-allow` attribute.
	 * Returns an idempotent unlock.
	 */
	lock(allow?: Element | null): () => void {
		if (typeof document === 'undefined') return () => {};
		if (allow) this.#allowed.add(allow);
		// Relock within the deferred-release window: body is still locked and #priorProperties still holds the true original — resume without re-#apply (which would capture the locked style).
		if (this.#pendingRestore !== null) {
			clearTimeout(this.#pendingRestore);
			this.#pendingRestore = null;
			this.#count += 1;
			return this.#makeRelease(allow);
		}
		if (this.#count === 0) this.#apply();
		this.#count += 1;
		return this.#makeRelease(allow);
	}

	#makeRelease(allow?: Element | null): () => void {
		let released = false;
		return () => {
			if (released) return;
			released = true;
			if (allow) this.#allowed.delete(allow);
			this.#count -= 1;
			if (this.#count === 0) {
				this.#pendingRestore = window.setTimeout(() => {
					this.#pendingRestore = null;
					if (this.#count === 0) this.#release();
				}, 0);
			}
		};
	}
}

export const scrollLock = new ScrollLock();
