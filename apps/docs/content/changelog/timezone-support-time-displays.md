---
title: 'Timezone support for all time displays'
category: 'Enhancement'
createdAt: '2026-01-25'
---

- Created centralized `time.ts` utility with automatic timezone detection
- All UTC timestamps now display in user's local timezone
- Updated event timestamps, session times, user visit times, and error timestamps
- Updated uptime check times and monitor status displays
- Updated link creation times and organization member join dates
- Replaced direct `dayjs` calls with timezone-aware utilities across 11 files
