<script lang="ts">
	import { Toast } from '../components/Toast';

	let { closeLabel = 'Close' }: { closeLabel?: string } = $props();
</script>

<Toast.Provider {closeLabel} />
