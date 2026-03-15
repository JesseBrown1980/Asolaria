# Google + NotebookLM Recovery Plan

Generated: 2026-03-08T23:16:56-03:00
Base: http://127.0.0.1:4781

## Summary
- Accounts: 4
- Ready: 1
- OAuth blocked: 2
- IAM blocked: 1
- Infra blocked: 0
- Enterprise degraded: 0

## Account Matrix

### jesse@jbrowndevelopmentllc.com
- Final state: oauth-blocked
- Next action: Complete Google OAuth reauth with a fresh link, then rerun this script.
- OAuth: reauth-needed
- OAuth reason: Google token request failed: Token has been expired or revoked.
- Enterprise: not-run
- Fresh OAuth link: https://accounts.google.com/o/oauth2/v2/auth?client_id=742368506950-i0a9e90pkv9784rvu9snmshblcdh7kaa.apps.googleusercontent.com&redirect_uri=http%3A%2F%2F127.0.0.1%3A4781%2Fapi%2Fintegrations%2Fgoogle%2Foauth%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform&access_type=offline&include_granted_scopes=true&prompt=consent&state=c9d15bcb5b94cc4528bda5402ac9aa61ad34&login_hint=jesse%40jbrowndevelopmentllc.com
- OAuth state: c9d15bcb5b94cc4528bda5402ac9aa61ad34

### jessebrown.soft1980@gmail.com
- Final state: iam-blocked
- Next action: Grant NotebookLM Enterprise permission for this account in project winged-complex-390417.
- OAuth: healthy
- Enterprise: failed
- Enterprise error class: iam-permission-denied
- Enterprise reason: Permission 'discoveryengine.notebooks.list' denied on resource '//discoveryengine.googleapis.com/projects/winged-complex-390417/locations/global' (or it may not exist).

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
- Fresh OAuth link: https://accounts.google.com/o/oauth2/v2/auth?client_id=742368506950-i0a9e90pkv9784rvu9snmshblcdh7kaa.apps.googleusercontent.com&redirect_uri=http%3A%2F%2F127.0.0.1%3A4781%2Fapi%2Fintegrations%2Fgoogle%2Foauth%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform&access_type=offline&include_granted_scopes=true&prompt=consent&state=ae26c46b677e4c23afb3128c17dd8b8fdcb3&login_hint=plasmatoid%40jbrowndevelopmentllc.com
- OAuth state: ae26c46b677e4c23afb3128c17dd8b8fdcb3

