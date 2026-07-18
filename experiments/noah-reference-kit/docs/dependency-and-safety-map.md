# Dependency and Safety Map

## Runtime patterns detected from the archived production bundle

The archived files are treated as reference material only. They are not trusted source code and must not be imported into production applications.

### Framework and application libraries

- React
- React Router DOM
- Redux Toolkit / React Redux
- Axios
- i18next
- Emotion
- Swiper
- Socket.IO client
- Day.js
- Lodash
- Numeral
- React Toastify
- Lottie
- QR code rendering
- CAPTCHA integrations

### Bundle/build characteristics

- Hashed JavaScript chunk names
- Vendor chunks split by dependency group
- Dynamic imports between feature chunks
- Minified production output
- Missing referenced chunks in the supplied archive
- CSS containing both application rules and third-party library rules

## Missing or incomplete dependency evidence

The archive is not a complete runnable source tree. At least these categories are incomplete:

1. Entry/runtime chunk graph
2. Source maps
3. Original package manifest and lockfile
4. Original TypeScript/JavaScript source
5. Environment variables
6. API schema and authentication contracts
7. Vendor configuration
8. Complete static asset graph

Therefore the bundle must not be executed inside `web-member`, `web-admin`, or `api`.

## Safety boundaries

The following data must never be copied from the archived application into production code:

- API base URLs and websocket URLs
- Authentication tokens, cookies, headers, or storage keys
- CAPTCHA site keys or vendor credentials
- Analytics, tracking, affiliate, or advertising identifiers
- Domain names and redirect targets
- Bank, payment, wallet, provider, or webhook configuration
- User identifiers or captured request payloads
- Error-reporting DSNs
- Feature flags controlled by the original service
- Obfuscated business rules that cannot be independently verified

## Allowed reuse path

Only these forms of reuse are allowed in the isolated reference kit:

- Visual hierarchy and layout observations
- Component naming as architecture hints
- Generic interaction patterns
- Color, spacing, radius, typography, and motion observations after normalization
- Assets that have documented provenance or an approved replacement plan
- Mock data created specifically for this repository

## Production migration rule

A reference component can move toward production only when all conditions are true:

1. Rewritten as TypeScript/React owned by this repository
2. Uses project design tokens and UI primitives
3. Uses project API-client contracts rather than archived endpoints
4. Passes typecheck, lint, accessibility, responsive, and visual checks
5. Contains no imported archived JavaScript bundle
6. Contains no copied credential, endpoint, tracking, or user data
7. Has explicit review before any route integration
