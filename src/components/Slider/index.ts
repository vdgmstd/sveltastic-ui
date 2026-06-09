import Root from './SliderRoot.svelte';
import Track from './SliderTrack.svelte';
import Range from './SliderRange.svelte';
import Thumb from './SliderThumb.svelte';
import Tick from './SliderTick.svelte';
import Tooltip from './SliderTooltip.svelte';

/** Range slider. Pure compound: `Slider.Root` + `Slider.Track`/`Range`/`Thumb`/`Tick`/`Tooltip`. */
export const Slider = { Root, Track, Range, Thumb, Tick, Tooltip };

export type { SliderType } from './slider.svelte';
export type { SliderRootProps } from './SliderRoot.svelte';
export type { SliderTrackProps } from './SliderTrack.svelte';
export type { SliderRangeProps } from './SliderRange.svelte';
export type { SliderThumbProps } from './SliderThumb.svelte';
export type { SliderTickProps } from './SliderTick.svelte';
export type { SliderTooltipProps } from './SliderTooltip.svelte';
