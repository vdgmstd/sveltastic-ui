import { FieldShellState } from '../../primitives/fieldShell.svelte';
import type {
	FieldShellConfig,
	InputVariant,
	InputLabelStyle,
	InputState
} from '../../primitives/fieldShell.svelte';

export type TextareaVariant = InputVariant;
export type TextareaLabelStyle = InputLabelStyle;
export type TextareaState = InputState;

export type TextareaRootConfig = FieldShellConfig & {
	getAutoGrow: () => boolean;
};

/** Textarea Root state — the shared field-shell engine plus the textarea-only autogrow flag. */
export class TextareaRootState extends FieldShellState {
	constructor(private textCfg: TextareaRootConfig) {
		super(textCfg);
	}

	get autoGrow(): boolean {
		return this.textCfg.getAutoGrow();
	}
}
