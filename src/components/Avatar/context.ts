import { getContext, setContext } from 'svelte';
import type { AvatarRootState } from './avatarState.svelte';

const KEY = Symbol('Avatar');

export function setAvatarContext(value: AvatarRootState): AvatarRootState {
	return setContext(KEY, value);
}

export function getAvatarContext(): AvatarRootState {
	const ctx = getContext<AvatarRootState | undefined>(KEY);
	if (!ctx) throw new Error('Avatar parts must be used within <Avatar.Root>');
	return ctx;
}
