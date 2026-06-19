import { createPartContext } from '../../utils/context';
import type { SliderRootState } from './slider.svelte';

const ctx = createPartContext<SliderRootState>('Slider', 'Slider parts must be used within <Slider.Root>');

export const setSliderCtx = ctx.set;
export const getSliderCtx = ctx.get;
