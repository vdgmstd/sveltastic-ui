import { createPartContext } from '../../utils/context';
import type { SegmentedRootState } from './segmentedState.svelte';

export type SegmentedValue = string | number;

/** Visual variant. `default` — gray track, accent thumb. `flat` — accent-tinted track. `border` — outlined track, no fill. `relief` — sunken track, raised thumb. */
export type SegmentedVariant = 'default' | 'flat' | 'border' | 'relief';

const ctx = createPartContext<SegmentedRootState>('Segmented', '<Segmented> parts must be used within <Segmented.Root>');

export const setSegmentedContext = ctx.set;
export const useSegmentedContext = ctx.get;
