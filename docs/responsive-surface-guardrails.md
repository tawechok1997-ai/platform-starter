# Responsive surface guardrails

## Surfaces

The platform has three visual surfaces:

1. Member
2. Admin
3. Public/Auth

Each surface has dedicated mobile and desktop presentation files while sharing the same data, API, route and business logic.

## Breakpoints

- Small mobile: 360-374px
- Mobile: 375-430px
- Tablet: 768-1023px
- Desktop: 1024-1439px
- Wide desktop: 1440px+

## File ownership

- Member mobile: `apps/web-member/app/member-mobile.css`
- Member desktop: `apps/web-member/app/member-desktop.css`
- Public/Auth mobile: `apps/web-member/app/public-mobile.css`
- Public/Auth desktop: `apps/web-member/app/public-desktop.css`
- Admin mobile/tablet: `apps/web-admin/app/admin-mobile.css`
- Admin desktop: `apps/web-admin/app/admin-desktop.css`

## Safety rules

- Do not duplicate API calls or business logic between mobile and desktop components.
- Prefer shared components with layout variants before creating device-specific component trees.
- Keep mobile-first base styles in shared stylesheets and add device-specific composition only in the surface files.
- Do not hide critical actions on either mobile or desktop.
- Touch targets must be at least 44px.
- Mobile fixed actions must respect `env(safe-area-inset-bottom)`.
- Tables must have a mobile card or horizontal-scroll fallback.
- Drawers and modals must lock background scrolling and restore it on close.
- Test long Thai labels, 200% zoom, reduced motion and keyboard navigation.

## Validation matrix

For each major route capture and verify:

- 360x800
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1440x900

Validate default, loading, empty, error, disabled and success states where available.
