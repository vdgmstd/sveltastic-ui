import Root from './Progress.svelte';
import Track from './ProgressTrack.svelte';
import Indicator from './ProgressIndicator.svelte';
import Label from './ProgressLabel.svelte';

/** Progress bar / ring. Compound: `Progress.Root` + `Progress.Track` / `Progress.Indicator` / `Progress.Label`. */
export const Progress = { Root, Track, Indicator, Label };

export type { ProgressRootProps, ProgressShape } from './Progress.svelte';
export type { ProgressTrackProps } from './ProgressTrack.svelte';
export type { ProgressIndicatorProps } from './ProgressIndicator.svelte';
export type { ProgressLabelProps } from './ProgressLabel.svelte';
