import { getContext, setContext } from 'svelte';
import type { SegmentedRootState } from './segmentedState.svelte';

export type SegmentedValue = string | number;

/** Visual variant. `default` — gray track, accent thumb. `flat` — accent-tinted track. `border` — outlined track, no fill. `relief` — sunken track, raised thumb. */
export type SegmentedVariant = 'default' | 'flat' | 'border' | 'relief';

const KEY = Symbol('Segmented');

export function setSegmentedContext(value: SegmentedRootState): SegmentedRootState {
	return setContext(KEY, value);
}

export function useSegmentedContext(): SegmentedRootState | undefined {
	return getContext<SegmentedRootState | undefined>(KEY);
}
