# Liris Asolaria Startup Report Template

Use this exact structure when sending the startup result back to Jesse.

## Identity

- Machine:
- Branch:
- Commit:
- Git status:

## Versions

- Node version:
- npm version:
- Codex version:

## Install

- npm install result:
- If failed, exact error:

## Startup

- Startup command used:
- Did `npm start` stay running:
- If it failed, exact error:
- If port was already in use, `netstat -ano | findstr :4781` output:

## Health JSON

```json
{}
```

## MQTT Port 18883

- Test-NetConnection result:

## Blocking Errors

- None / list exact blockers

## Notes

- Return this report to Jesse through manual owner relay only.
- Do not use `4799`.
- Do not attempt the friend bridge until Jesse explicitly says the room/policy is live.
