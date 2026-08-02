# Presentation demo data safety

Presentation fallback records are display-only.

- Usernames are masked.
- No wallet, deposit, withdrawal, bonus-ledger, or provider-transfer record is created.
- Real API and CMS data take priority.
- Disable all presentation fallbacks with `presentation_demo_enabled=false`.
- Featured games use the existing persisted Game Control flags rather than a second catalog.
