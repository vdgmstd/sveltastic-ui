import type { Theme } from '../types';
import { isBrowser } from '../utils/dom';

const STORAGE_KEY = 'sveltastic-ui:theme';

function readStored(): Theme | null {
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		return v === 'light' || v === 'dark' ? v : null;
	} catch {
		return null;
	}
}

function detectTheme(): Theme {
	if (!isBrowser) return 'light';
	const stored = readStored();
	if (stored) return stored;
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
		try {
			window.localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// storage blocked (private mode / disabled cookies) — skip persistence
		}
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

	/** Sync rune state with `<html data-theme>` (set by the app's pre-paint script); else auto-detect + apply, never persisting. */
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
