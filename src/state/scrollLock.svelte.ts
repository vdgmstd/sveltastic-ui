class ScrollLock {
	#count = 0;
	#priorStyle: string | null = null;
	#touchHandler: ((e: TouchEvent) => void) | null = null;
	#pendingRestore: number | null = null;

	#hasStableGutter(): boolean {
		if (typeof window === 'undefined') return false;
		const gutter = getComputedStyle(document.documentElement).scrollbarGutter;
		return gutter.includes('stable');
	}

	#apply(): void {
		const body = document.body;
		this.#priorStyle = body.getAttribute('style') ?? '';

		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		const compensate = !this.#hasStableGutter() && scrollbarWidth > 0;

		body.style.overflow = 'hidden';
		if (compensate) {
			const priorPad = parseFloat(getComputedStyle(body).paddingRight) || 0;
			body.style.paddingRight = `${priorPad + scrollbarWidth}px`;
			body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
		}

		this.#touchHandler = (e: TouchEvent): void => {
			if (e.touches.length > 1) return;
			const target = e.target as Element | null;
			if (target?.closest('[data-scroll-lock-allow]')) return;
			e.preventDefault();
		};
		document.addEventListener('touchmove', this.#touchHandler, { passive: false });
	}

	#release(): void {
		const body = document.body;
		if (this.#priorStyle) body.setAttribute('style', this.#priorStyle);
		else body.removeAttribute('style');
		this.#priorStyle = null;
		if (this.#touchHandler) {
			document.removeEventListener('touchmove', this.#touchHandler);
			this.#touchHandler = null;
		}
	}

	/** Lock body scroll (ref-counted). Returns an idempotent unlock. */
	lock(): () => void {
		if (typeof document === 'undefined') return () => {};
		// Relock within the deferred-release window: body is still locked and #priorStyle still holds the true original — resume without re-#apply (which would capture the locked style).
		if (this.#pendingRestore !== null) {
			clearTimeout(this.#pendingRestore);
			this.#pendingRestore = null;
			this.#count += 1;
			return this.#makeRelease();
		}
		if (this.#count === 0) this.#apply();
		this.#count += 1;
		return this.#makeRelease();
	}

	#makeRelease(): () => void {
		let released = false;
		return () => {
			if (released) return;
			released = true;
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
