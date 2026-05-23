let counter = 0;

export function nextId(prefix = 'sa'): string {
	counter += 1;
	return `${prefix}-${counter}`;
}
