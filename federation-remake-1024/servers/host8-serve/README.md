# Host8 Serve

First userland Host8 serving binary for the federation Rust workspace.

Scope:

- serves HBP over loopback HTTP
- exposes `/health.hbp`, `/room.hbp`, and `/feed.hbp`
- depends on `asolaria-kernel-core` plus the five server libraries
- defaults to the `gnn-dispatch-bridge` dark/non-spine room
- does not start, stop, or retire any legacy Node process

Run once:

```powershell
cargo run --manifest-path federation-remake-1024/Cargo.toml -p asolaria-host8-serve -- --once
```

Serve:

```powershell
cargo run --manifest-path federation-remake-1024/Cargo.toml -p asolaria-host8-serve -- --bind 127.0.0.1:5088
```

Liris status on 2026-06-17: source present, but local Windows and Ubuntu WSL both lack `cargo` and `rustc`, so compile/run verification is delegated to Acer until Rust is installed here.
