import { initClickHouseSchema } from './schema';

(async () => {
	const result = await initClickHouseSchema();
	if (result.success) {
		process.exit(0);
	} else {
		if (result.error) {
		}
		process.exit(1);
	}
})();
