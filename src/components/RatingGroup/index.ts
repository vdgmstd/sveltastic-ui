import Root from './RatingGroupRoot.svelte';
import Item from './RatingGroupItem.svelte';

/** Star rating. Pure compound: `RatingGroup.Root` (a slider-role widget) + `RatingGroup.Item`. */
export const RatingGroup = { Root, Item };

export type { RatingGroupRootProps } from './RatingGroupRoot.svelte';
export type { RatingGroupItemProps, RatingGroupItemState } from './RatingGroupItem.svelte';
export type { RatingGroupOrientation } from './context';
export type { RatingGroupValueText } from './ratingGroupState.svelte';
