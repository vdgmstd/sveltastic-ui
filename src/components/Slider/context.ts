import { getContext, setContext } from 'svelte';
import type { SliderRootState } from './slider.svelte';

const KEY = Symbol('Slider');

export function setSliderCtx(value: SliderRootState): SliderRootState {
	return setContext(KEY, value);
}

export function getSliderCtx(): SliderRootState {
	const ctx = getContext<SliderRootState | undefined>(KEY);
	if (!ctx) throw new Error('Slider parts must be used within <Slider.Root>');
	return ctx;
}
