import { createPartContext } from '../../utils/context';
import type { RatingGroupRootState } from './ratingGroupState.svelte';

export type RatingGroupOrientation = 'horizontal' | 'vertical';

const root = createPartContext<RatingGroupRootState>(
	'RatingGroup',
	'RatingGroup parts must be used within <RatingGroup.Root>'
);

export const setRatingGroupCtx = root.set;

export const getRatingGroupCtx = root.get;
