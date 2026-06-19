import { createPartContext } from '../../utils/context';
import type { AvatarRootState } from './avatarState.svelte';

const ctx = createPartContext<AvatarRootState>('Avatar', 'Avatar parts must be used within <Avatar.Root>');

export const setAvatarContext = ctx.set;
export const getAvatarContext = ctx.get;
