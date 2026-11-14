# Previous monthly-only risk plan — superseded

The earlier monthly-only revision has been superseded by the user's instruction to choose the safe, cost-effective approach rather than impose monthly-only reviews.

See [Safe Firestore cost controls](firestore-cost-controls.md) for the current behavior, implementation trade-offs, checks and [safe rollout order](firestore-cost-controls.md#safe-rollout--only-after-approval).

The current review cadence is server-managed: daily by default to fit the initial 48-hour warning window, with explicit weekly or monthly deployment settings. Daily bounded push recovery is independent of full academic reviews. The existing bounded worker, privacy, acknowledgement, no-op persistence and deny-only retired manual endpoint remain intact.

This file is retained as a stable link for older PRs and documentation. Its former monthly deployment commands and validation counts are historical, not current rollout instructions or proof of deployed behavior. Git history preserves the earlier plan.
