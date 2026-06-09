import Root from './Avatar.svelte';
import Image from './AvatarImage.svelte';
import Fallback from './AvatarFallback.svelte';
import Badge from './AvatarBadge.svelte';
import Icons from './AvatarIcons.svelte';
import Group from './AvatarGroup.svelte';

/** Avatar. Compound: `Avatar.Root` + `Avatar.Image` / `Fallback` / `Badge` / `Icons` / `Group`. */
export const Avatar = { Root, Image, Fallback, Badge, Icons, Group };

export type { AvatarRootProps, AvatarBadgePosition, AvatarIconsPlacement } from './Avatar.svelte';
export type { AvatarImageProps } from './AvatarImage.svelte';
export type { AvatarFallbackProps } from './AvatarFallback.svelte';
export type { AvatarBadgeProps } from './AvatarBadge.svelte';
export type { AvatarIconsProps } from './AvatarIcons.svelte';
export type { AvatarGroupProps } from './AvatarGroup.svelte';
export type { AvatarLoadingStatus } from './avatarState.svelte';
export type { AvatarRegistration, AvatarGroupContext } from './group';
