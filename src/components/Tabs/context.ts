import { getContext, setContext } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';
import type { Color, Size } from '../../types';

export type TabsVariant = 'underline' | 'default' | 'tonal' | 'border' | 'relief';
export type TabsPanelVariant = 'plain' | 'card';
export type TabsTransition = 'fade' | 'crossfade' | 'slide' | 'none';

export type TabsTransitionFn = (
	node: Element,
	params: { key: string }
) => TransitionConfig | (() => TransitionConfig);

export type TabsContext = {
	readonly value: string | undefined;
	readonly color: Color;
	readonly variant: TabsVariant;
	readonly size: Size;
	readonly panelVariant: TabsPanelVariant;
	readonly transition: TabsTransition;
	readonly disabled: boolean;
	readonly baseId: string;
	readonly order: readonly string[];
	readonly send: TabsTransitionFn;
	readonly receive: TabsTransitionFn;
	/** Thumb ripple host published by `<TabList>`; `undefined` for `underline` or when no list mounted. */
	readonly thumbLayer: HTMLElement | undefined;
	setActive: (value: string) => void;
	tabId: (value: string) => string;
	panelId: (value: string) => string;
	register: (value: string, el: HTMLElement, getDisabled: () => boolean) => void;
	unregister: (value: string) => void;
	getEl: (value: string) => HTMLElement | undefined;
	focusNext: (from: string, dir: 1 | -1) => void;
	focusEdge: (edge: 'first' | 'last') => void;
	setThumbLayer: (el: HTMLElement | undefined) => void;
};

const KEY = Symbol('tabs');

export function createTabsContext(value: TabsContext): void {
	setContext(KEY, value);
}

export function useTabsContext(): TabsContext | undefined {
	return getContext<TabsContext | undefined>(KEY);
}
