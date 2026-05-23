import type { Theme } from '../types';
import { isBrowser } from '../utils/dom';

const STORAGE_KEY = 'sveltastic-ui:theme';

function detectTheme(): Theme {
	if (!isBrowser) return 'light';
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

class ThemeState {
	theme = $state<Theme>('light');
	rtl = $state(false);

	/** Apply a theme everywhere AND persist it as the user's explicit choice. */
	setTheme(next: Theme): void {
		this.theme = next;
		if (!isBrowser) return;
		document.documentElement.setAttribute('data-theme', next);
		window.localStorage.setItem(STORAGE_KEY, next);
	}

	toggleTheme(): void {
		this.setTheme(this.theme === 'light' ? 'dark' : 'light');
	}

	setRtl(next: boolean): void {
		this.rtl = next;
		if (!isBrowser) return;
		document.documentElement.setAttribute('dir', next ? 'rtl' : 'ltr');
	}

	toggleRtl(): void {
		this.setRtl(!this.rtl);
	}

	/**
	 * Sync the rune state with whatever is already on `<html data-theme>` —
	 * normally set by the consumer's pre-paint inline script in `app.html`
	 * (see README "Setup"). If the attribute isn't there (script absent
	 * or storage unavailable), fall back to auto-detect and apply, but do
	 * NOT persist — only an explicit `setTheme` from a user toggle does that.
	 */
	hydrate(): void {
		if (!isBrowser) return;
		const current = document.documentElement.getAttribute('data-theme');
		if (current === 'light' || current === 'dark') {
			this.theme = current;
		} else {
			const detected = detectTheme();
			this.theme = detected;
			document.documentElement.setAttribute('data-theme', detected);
		}
		this.rtl = document.documentElement.getAttribute('dir') === 'rtl';
	}
}

export const theme = new ThemeState();
