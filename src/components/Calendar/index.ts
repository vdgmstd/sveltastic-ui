import Root from './Calendar.svelte';
import Header from './CalendarHeader.svelte';
import Heading from './CalendarHeading.svelte';
import PrevButton from './CalendarPrevButton.svelte';
import NextButton from './CalendarNextButton.svelte';
import Grid from './CalendarGrid.svelte';
import GridBody from './CalendarGridBody.svelte';
import Cell from './CalendarCell.svelte';
import Day from './CalendarDay.svelte';

/** Date calendar. Internal-render compound: `Calendar.Root` plus the chrome parts `Header`/`Heading`/`PrevButton`/`NextButton`/`Grid`/`GridBody`/`Cell`/`Day`. */
export const Calendar = {
	Root,
	Header,
	Heading,
	PrevButton,
	NextButton,
	Grid,
	GridBody,
	Cell,
	Day
};

export type { CalendarRootProps, CalendarColor } from './Calendar.svelte';
export type { CalendarHeaderProps } from './CalendarHeader.svelte';
export type { CalendarHeadingProps } from './CalendarHeading.svelte';
export type { CalendarPrevButtonProps } from './CalendarPrevButton.svelte';
export type { CalendarNextButtonProps } from './CalendarNextButton.svelte';
export type { CalendarGridProps } from './CalendarGrid.svelte';
export type { CalendarGridBodyProps } from './CalendarGridBody.svelte';
export type { CalendarCellProps } from './CalendarCell.svelte';
export type { CalendarDayProps } from './CalendarDay.svelte';
export type {
	CalendarType,
	CalendarView,
	CalendarWeekdayFormat,
	CalendarDayState,
	CalendarOptionItem
} from './calendarState.svelte';
