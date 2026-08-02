# Game and provider assets

This workspace stores presentation overrides in `metadata.presentation`.

Resolution order:

1. Platform override (`pc*Url` or `mobile*Url`)
2. Shared value (`shared*Url`)
3. Catalog media or provider logo
4. Local asset resolver
5. CDN fallback

Provider and game media are intentionally separate. Changing a game image never replaces a provider logo or provider card.
