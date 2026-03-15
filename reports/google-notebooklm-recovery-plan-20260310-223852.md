# Google + NotebookLM Recovery Plan

Generated: 2026-03-10T22:38:52-03:00
Base: http://127.0.0.1:4781

## Summary
- Accounts: 4
- Ready: 1
- OAuth blocked: 2
- IAM blocked: 0
- Infra blocked: 0
- Enterprise degraded: 1

## Account Matrix

### jesse@jbrowndevelopmentllc.com
- Final state: oauth-blocked
- Next action: Complete Google OAuth reauth with a fresh link, then rerun this script.
- OAuth: reauth-needed
- OAuth reason: Google token request failed: reauth related error (invalid_rapt)
- Enterprise: not-run
- Fresh OAuth link: https://accounts.google.com/o/oauth2/v2/auth?client_id=742368506950-i0a9e90pkv9784rvu9snmshblcdh7kaa.apps.googleusercontent.com&redirect_uri=http%3A%2F%2F127.0.0.1%3A4781%2Fapi%2Fintegrations%2Fgoogle%2Foauth%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform&access_type=offline&include_granted_scopes=true&prompt=consent&state=2e4703bc5fe0df15811150b42686a9dea3cc&login_hint=jesse%40jbrowndevelopmentllc.com
- OAuth state: 2e4703bc5fe0df15811150b42686a9dea3cc

### jessebrown.soft1980@gmail.com
- Final state: enterprise-degraded
- Next action: Inspect enterprise error details and rerun this script.
- OAuth: healthy
- Enterprise: failed
- Enterprise error class: enterprise-error
- Enterprise reason: UserStore projects/742368506950/locations/global/userStores/default_user_store has reached license config quota for license config projects/742368506950/locations/global/licenseConfigs/62fc0f5e-8b41-4ca2-99e9-b2b8469e4b49

### plasmatoid@gmail.com
- Final state: ready
- Next action: No action needed.
- OAuth: healthy
- Enterprise: completed
- Enterprise notebooks: Asolaria Enterprise Memory

### plasmatoid@jbrowndevelopmentllc.com
- Final state: oauth-blocked
- Next action: Complete Google OAuth reauth with a fresh link, then rerun this script.
- OAuth: reauth-needed
- OAuth reason: Google token request failed: reauth related error (invalid_rapt)
- Enterprise: not-run
- Fresh OAuth link: https://accounts.google.com/o/oauth2/v2/auth?client_id=742368506950-i0a9e90pkv9784rvu9snmshblcdh7kaa.apps.googleusercontent.com&redirect_uri=http%3A%2F%2F127.0.0.1%3A4781%2Fapi%2Fintegrations%2Fgoogle%2Foauth%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform&access_type=offline&include_granted_scopes=true&prompt=consent&state=e2367469b1154a00eb46b08b553da5f50cef&login_hint=plasmatoid%40jbrowndevelopmentllc.com
- OAuth state: e2367469b1154a00eb46b08b553da5f50cef

