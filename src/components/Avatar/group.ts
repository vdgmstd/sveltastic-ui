/** Per-avatar slot derived by AvatarGroup from document order. */
export type AvatarRegistration = {
	index: number;
	total: number;
	max: number | undefined;
	float: boolean;
};

/** Context AvatarGroup provides to each child Avatar for overlap/`+N` math. */
export type AvatarGroupContext = {
	register(node: HTMLElement): { state: () => AvatarRegistration; unregister(): void };
};

export const AVATAR_GROUP_KEY = Symbol('avatar-group');
