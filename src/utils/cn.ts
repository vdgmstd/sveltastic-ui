import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge kit classes with consumer overrides. Resolves Tailwind utility conflicts so the later value wins (`px-4` from consumer overrides `px-2` from the kit). */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
