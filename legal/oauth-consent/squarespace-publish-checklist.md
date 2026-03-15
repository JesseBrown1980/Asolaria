# Squarespace Publish Checklist (OAuth Consent)
Date: 2026-02-25

## Goal URLs
- Home page: `https://www.jbrowndevelopmentllc.com/`
- Privacy policy: `https://www.jbrowndevelopmentllc.com/privacy`
- Terms of service: `https://www.jbrowndevelopmentllc.com/terms`

## Files to copy from
- `privacy-policy-jbrowndevelopmentllc.md`
- `terms-of-service-jbrowndevelopmentllc.md`

## Squarespace steps
1. Log in to Squarespace and open site editor for `jbrowndevelopmentllc.com`.
2. Go to `Pages`.
3. Click `+` under `Not Linked` and create a `Blank Page` named `Privacy Policy`.
4. Set URL slug to `privacy`.
5. Add a text block and paste the policy text.
6. Repeat for a `Blank Page` named `Terms of Service` with slug `terms`.
7. Save/Publish both pages.

## Google Auth Platform fields
- Application home page: `https://www.jbrowndevelopmentllc.com/`
- Privacy policy link: `https://www.jbrowndevelopmentllc.com/privacy`
- Terms of service link: `https://www.jbrowndevelopmentllc.com/terms`
- Authorized domain: `jbrowndevelopmentllc.com` (lowercase)
- Developer contact email: `jesse@jbrowndevelopmentllc.com`

## Test users to add (Testing mode)
- `jesse@jbrowndevelopmentllc.com`
- `plasmatoid@jbrowndevelopmentllc.com`
- `plasmatoid@gmail.com`

## Validation
1. Open each URL in an incognito window and confirm public access.
2. Retry Google OAuth flow for `jesse@jbrowndevelopmentllc.com`.
3. Run Asolaria enterprise status check again.

