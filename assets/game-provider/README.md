# Game provider assets

This directory is reserved for imported game-provider assets.

Planned structure:

```text
assets/game-provider/
├── mobile/
│   ├── providers/
│   ├── games/
│   └── gamecards/
└── pc/
    ├── providers/
    ├── games/
    └── gamecards/
```

Source bundles received for import:

- `noah345_shopmobil(2).zip` — mobile asset bundle, approximately 59 MB
- `noah345_hhh_extracted (2).rar` — desktop asset bundle, approximately 298 MB

The source archives themselves are intentionally not committed. Assets must be extracted, normalized, deduplicated and committed as individual files. The desktop RAR exceeds GitHub's normal 100 MB per-file limit and requires extraction or Git LFS before upload.
