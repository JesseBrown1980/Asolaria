# SingleStore Setup Runbook (Asolaria)

## 1) Wait for Workspace Ready

- Keep the page open until `workspace-44626487` status is `Running/Active` (not provisioning).

## 2) Run Bootstrap SQL

- Open SQL Editor in SingleStore.
- Run this file:
  - `C:\Users\acer\Asolaria\reports\singlestore-bootstrap.sql`
- Replace `CHANGE_ME_STRONG_PASSWORD` before execution.

## 3) Collect Connection Values

From SingleStore workspace connection details, capture:

- Host
- Port
- Database: `asolaria_control`
- Username: `asolaria_app`
- Password: (the value used in bootstrap SQL)
- SSL mode: required/preferred (as shown by SingleStore)

## 4) Asolaria Wiring (next step)

After you have the values above, provide them and we wire a dedicated Asolaria connector profile:

- `SINGLESTORE_HOST`
- `SINGLESTORE_PORT`
- `SINGLESTORE_DB`
- `SINGLESTORE_USER`
- `SINGLESTORE_PASSWORD`
- `SINGLESTORE_SSL`

Then we add connector actions:

- health check
- write event record
- read recent events
- write task run result
