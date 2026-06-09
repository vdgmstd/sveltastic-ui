import Root from './CardRoot.svelte';
import Media from './CardMedia.svelte';
import Image from './CardImage.svelte';
import Overlay from './CardOverlay.svelte';
import Header from './CardHeader.svelte';
import Body from './CardBody.svelte';
import Footer from './CardFooter.svelte';

/** Card surface. Compound: `Card.Root` + `Card.Media`/`Card.Image`/`Card.Overlay`/`Card.Header`/`Card.Body`/`Card.Footer`. */
export const Card = { Root, Media, Image, Overlay, Header, Body, Footer };

export type { CardRootProps, CardVariant } from './CardRoot.svelte';
export type { CardMediaProps } from './CardMedia.svelte';
export type { CardImageProps } from './CardImage.svelte';
export type { CardOverlayProps } from './CardOverlay.svelte';
export type { CardHeaderProps } from './CardHeader.svelte';
export type { CardBodyProps } from './CardBody.svelte';
export type { CardFooterProps } from './CardFooter.svelte';
