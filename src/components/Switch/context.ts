import { createPartContext } from '../../utils/context';
import type { SwitchRootState } from './switchState.svelte';

const ctx = createPartContext<SwitchRootState>('Switch', '<Switch.Thumb>/<Switch.Icon>/<Switch.Label> must be used within <Switch.Root>');

export const setSwitchContext = ctx.set;
export const useSwitchContext = ctx.get;
