use std::env;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::process;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use asolaria_kernel_core::{FEDERATION_ANCHOR_PID, KERNEL_VERSION};
use asolaria_server_agent_runtime::spawn_child_agent_count;
use asolaria_server_cosign_ledger::CosignChain;
use asolaria_server_gnn_oracle::{GnnInference, ObservedFrame};
use asolaria_server_highway::check_transit;
use asolaria_server_tier_policy::{policy_for, AccessTier};

const DEFAULT_BIND: &str = "127.0.0.1:5088";
const DEFAULT_ROOM_ID: &str = "gnn-dispatch-bridge";
const DEFAULT_ROOM_STUB: &str = "rooms/task-manager/bridge/gnn-dispatch-bridge";

#[derive(Clone, Debug, PartialEq, Eq)]
struct Room {
    id: String,
    room_stub: String,
    target_runtime: String,
    legacy_runtime: String,
    legacy_path: String,
    lane: String,
    swap_gate: String,
    host_handle8: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct Config {
    bind: String,
    room_stub_path: Option<String>,
    cadence_frame_path: Option<String>,
    once: bool,
}

fn main() {
    let config = parse_args(env::args().skip(1));
    let room = config
        .room_stub_path
        .as_deref()
        .and_then(load_room_stub)
        .unwrap_or_else(default_room);
    let mut gnn = GnnInference::new();

    let started = Instant::now();
    if config.once {
        print!("{}", render_feed(&room, &config, started, &mut gnn));
        return;
    }

    let listener = match TcpListener::bind(&config.bind) {
        Ok(listener) => listener,
        Err(error) => {
            eprintln!(
                "HOST8ERR|bind={}|error={}|json=0",
                hbp_escape(&config.bind),
                hbp_escape(error.to_string())
            );
            process::exit(2);
        }
    };

    println!(
        "HOST8LISTEN|bind={}|id={}|room_stub={}|host_handle8={}|json=0",
        hbp_escape(&config.bind),
        hbp_escape(&room.id),
        hbp_escape(&room.room_stub),
        hbp_escape(&room.host_handle8)
    );

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => handle_client(stream, &room, &config, started, &mut gnn),
            Err(error) => eprintln!("HOST8ERR|accept={}|json=0", hbp_escape(error.to_string())),
        }
    }
}

fn parse_args<I>(args: I) -> Config
where
    I: IntoIterator<Item = String>,
{
    let mut config = Config {
        bind: DEFAULT_BIND.to_string(),
        room_stub_path: None,
        cadence_frame_path: env::var("ASOLARIA_CADENCE_FRAME").ok(),
        once: false,
    };
    let args: Vec<String> = args.into_iter().collect();
    let mut i = 0usize;
    while i < args.len() {
        match args[i].as_str() {
            "--bind" => {
                if let Some(value) = args.get(i + 1) {
                    config.bind = value.clone();
                    i += 1;
                }
            }
            "--room-stub" => {
                if let Some(value) = args.get(i + 1) {
                    config.room_stub_path = Some(value.clone());
                    i += 1;
                }
            }
            "--cadence-frame" => {
                if let Some(value) = args.get(i + 1) {
                    config.cadence_frame_path = Some(value.clone());
                    i += 1;
                }
            }
            "--once" => config.once = true,
            _ => {}
        }
        i += 1;
    }
    config
}

fn default_room() -> Room {
    Room {
        id: DEFAULT_ROOM_ID.to_string(),
        room_stub: DEFAULT_ROOM_STUB.to_string(),
        target_runtime: "8byte-rust-host".to_string(),
        legacy_runtime: "node".to_string(),
        legacy_path: "tools/behcs/gnn-dispatch-bridge.mjs".to_string(),
        lane: "retire-or-host8".to_string(),
        swap_gate: "parity-before-retire".to_string(),
        host_handle8: host_handle8(&format!("{}|{}", DEFAULT_ROOM_ID, DEFAULT_ROOM_STUB)),
    }
}

fn load_room_stub(path: &str) -> Option<Room> {
    let body = fs::read_to_string(path).ok()?;
    let id = hbp_field(&body, "id").unwrap_or_else(|| DEFAULT_ROOM_ID.to_string());
    let room_stub = hbp_field(&body, "room_stub").unwrap_or_else(|| DEFAULT_ROOM_STUB.to_string());
    let host_handle8 = hbp_field(&body, "host_handle8")
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| host_handle8(&format!("{}|{}", id, room_stub)));
    Some(Room {
        id,
        room_stub,
        target_runtime: hbp_field(&body, "target_runtime").unwrap_or_else(|| "8byte-rust-host".to_string()),
        legacy_runtime: hbp_field(&body, "legacy_runtime").unwrap_or_else(|| "node".to_string()),
        legacy_path: hbp_field(&body, "legacy_path").unwrap_or_default(),
        lane: hbp_field(&body, "lane").unwrap_or_else(|| "retire-or-host8".to_string()),
        swap_gate: hbp_field(&body, "swap_gate").unwrap_or_else(|| "parity-before-retire".to_string()),
        host_handle8,
    })
}

fn hbp_field(text: &str, key: &str) -> Option<String> {
    for line in text.lines() {
        for part in line.split('|').skip(1) {
            if let Some((field_key, value)) = part.split_once('=') {
                if field_key == key {
                    return Some(value.trim().to_string());
                }
            }
        }
    }
    None
}

fn parse_u64_field(value: &str) -> Option<u64> {
    let trimmed = value.trim();
    if let Some(hex) = trimmed.strip_prefix("0x") {
        u64::from_str_radix(hex, 16).ok()
    } else if trimmed.chars().all(|ch| ch.is_ascii_hexdigit())
        && trimmed.chars().any(|ch| ch.is_ascii_alphabetic())
    {
        u64::from_str_radix(trimmed, 16).ok()
    } else {
        trimmed.parse::<u64>().ok()
    }
}

fn load_observed_frame(path: &str) -> Option<ObservedFrame> {
    let body = fs::read_to_string(path).ok()?;
    let line = body.lines().rev().find(|line| line.contains("tick="))?;
    let tick = hbp_field(line, "tick").and_then(|v| parse_u64_field(&v))?;
    let phash = hbp_field(line, "phash").and_then(|v| parse_u64_field(&v))?;
    let frame_delta = hbp_field(line, "frame_delta")
        .and_then(|v| parse_u64_field(&v))
        .unwrap_or(0)
        .min(u32::MAX as u64) as u32;
    let entropy_q = hbp_field(line, "entropy_q")
        .and_then(|v| parse_u64_field(&v))
        .unwrap_or(0)
        .min(u32::MAX as u64) as u32;
    let pid_fingerprint = hbp_field(line, "pid_fingerprint")
        .and_then(|v| parse_u64_field(&v))
        .or_else(|| hbp_field(line, "pid").map(|pid| fnv1a64(&pid)))
        .unwrap_or(0);
    Some(ObservedFrame {
        tick,
        phash,
        frame_delta,
        entropy_q,
        pid_fingerprint,
    })
}

fn canonicalize(input: &str) -> String {
    let mut output = String::with_capacity(input.len());
    let mut in_control_run = false;
    for ch in input.chars() {
        if matches!(ch, '\t' | '\r' | '\n') {
            if !in_control_run {
                output.push(' ');
            }
            in_control_run = true;
        } else {
            output.push(ch);
            in_control_run = false;
        }
    }
    output
}

fn fnv1a64(input: &str) -> u64 {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in canonicalize(input).as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

fn host_handle8(input: &str) -> String {
    format!("{:016x}", fnv1a64(input))
}

fn unix_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0))
        .as_secs()
}

fn hbp_escape<T: ToString>(value: T) -> String {
    value
        .to_string()
        .chars()
        .map(|ch| match ch {
            '|' | '\r' | '\n' | '\t' => '_',
            ch if ch.is_ascii_graphic() || ch == ' ' => ch,
            _ => '_',
        })
        .take(240)
        .collect()
}

fn render_feed(room: &Room, config: &Config, started: Instant, gnn: &mut GnnInference) -> String {
    let chain = CosignChain::new();
    let gnn_frame_source = config.cadence_frame_path.as_deref().unwrap_or("-");
    let gnn_frame_ingested = config
        .cadence_frame_path
        .as_deref()
        .and_then(load_observed_frame)
        .map(|frame| gnn.observe_frame(frame))
        .unwrap_or(false);
    let gnn_ready = gnn.is_ready();
    let gnn_model_sha16 = gnn.model_sha16().unwrap_or("-");
    let gnn_frame = gnn.latest_frame();
    let gnn_score_q = gnn.preview_latest_score_q().unwrap_or(0);
    let public_policy = policy_for(AccessTier::Public);
    let public_to_secret = check_transit(AccessTier::Public, AccessTier::Secret)
        .map(|verdict| verdict.authorized)
        .unwrap_or(false);
    let room_stub_source = config.room_stub_path.as_deref().unwrap_or("default-embedded");

    [
        format!(
            "HOST8HDR|schema=ASOLARIA-HOST8-SERVE|version=0.1.0|runtime=rust-std|generated_unix_s={}|json=0",
            unix_seconds()
        ),
        format!(
            "HOST8KERNEL|version={}|anchor_pid={}|server_libs=5|json=0",
            hbp_escape(KERNEL_VERSION),
            hbp_escape(FEDERATION_ANCHOR_PID)
        ),
        format!(
            "HOST8ROOM|id={}|room_stub={}|host_handle8={}|target_runtime={}|lane={}|json=0",
            hbp_escape(&room.id),
            hbp_escape(&room.room_stub),
            hbp_escape(&room.host_handle8),
            hbp_escape(&room.target_runtime),
            hbp_escape(&room.lane)
        ),
        format!(
            "HOST8PROC|os_pid={}|bind={}|uptime_s={}|room_stub_source={}|json=0",
            process::id(),
            hbp_escape(&config.bind),
            started.elapsed().as_secs(),
            hbp_escape(room_stub_source)
        ),
        format!(
            "HOST8LIBS|agent_runtime_spawn_count={}|cosign_head={}|gnn_ready={}|gnn_engine={}|gnn_model_sha16={}|gnn_frame_source={}|gnn_frame_ingested={}|gnn_frame_tick={}|gnn_score_q={}|public_policy={:?}|public_to_secret_authorized={}|json=0",
            spawn_child_agent_count(),
            hbp_escape(chain.head()),
            if gnn_ready { 1 } else { 0 },
            hbp_escape(gnn.engine_mode()),
            hbp_escape(gnn_model_sha16),
            hbp_escape(gnn_frame_source),
            if gnn_frame_ingested { 1 } else { 0 },
            gnn_frame.map(|frame| frame.tick).unwrap_or(0),
            gnn_score_q,
            public_policy.authority,
            if public_to_secret { 1 } else { 0 }
        ),
        format!(
            "HOST8LEGACY|legacy_runtime={}|legacy_path={}|node_retired=0|json=0",
            hbp_escape(&room.legacy_runtime),
            hbp_escape(&room.legacy_path)
        ),
        format!(
            "HOST8GATE|swap_gate={}|parity_proven=0|spine_touched=0|dashboard_touched=0|cosign_touched=0|json=0",
            hbp_escape(&room.swap_gate)
        ),
        "HOST8ROUTE|path=/health.hbp|method=GET|format=HBP|json=0".to_string(),
        "HOST8ROUTE|path=/room.hbp|method=GET|format=HBP|json=0".to_string(),
        "HOST8ROUTE|path=/feed.hbp|method=GET|format=HBP|json=0".to_string(),
    ]
    .join("\n")
        + "\n"
}

fn render_not_found(path: &str) -> String {
    format!("HOST8ERR|status=404|path={}|reason=not_found|json=0\n", hbp_escape(path))
}

fn handle_client(
    mut stream: TcpStream,
    room: &Room,
    config: &Config,
    started: Instant,
    gnn: &mut GnnInference,
) {
    let mut buffer = [0u8; 2048];
    let read = match stream.read(&mut buffer) {
        Ok(read) => read,
        Err(_) => return,
    };
    let request = String::from_utf8_lossy(&buffer[..read]);
    let first_line = request.lines().next().unwrap_or("");
    let path = first_line.split_whitespace().nth(1).unwrap_or("/");
    let (status, body) = match path {
        "/" | "/health.hbp" | "/room.hbp" | "/feed.hbp" => {
            ("200 OK", render_feed(room, config, started, gnn))
        }
        other => ("404 Not Found", render_not_found(other)),
    };
    let response = format!(
        "HTTP/1.1 {}\r\nContent-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\nContent-Length: {}\r\n\r\n{}",
        status,
        body.len(),
        body
    );
    let _ = stream.write_all(response.as_bytes());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonicalization_matches_tmhost_v1_1() {
        assert_eq!(canonicalize("a\tb\r\nc"), "a b c");
    }

    #[test]
    fn host_handle8_is_eight_bytes_hex() {
        let handle = host_handle8("gnn-dispatch-bridge|rooms/task-manager/bridge/gnn-dispatch-bridge");
        assert_eq!(handle.len(), 16);
        assert!(handle.chars().all(|ch| ch.is_ascii_hexdigit()));
    }

    #[test]
    fn parses_room_stub_fields() {
        let text = "ROOMSTUB|id=x|room_stub=rooms/x|target_runtime=8byte-rust-host|json=0\n";
        assert_eq!(hbp_field(text, "id").as_deref(), Some("x"));
        assert_eq!(hbp_field(text, "room_stub").as_deref(), Some("rooms/x"));
    }

    #[test]
    fn once_feed_is_hbp_only() {
        let config = Config {
            bind: DEFAULT_BIND.to_string(),
            room_stub_path: None,
            cadence_frame_path: None,
            once: true,
        };
        let mut gnn = GnnInference::new();
        let feed = render_feed(&default_room(), &config, Instant::now(), &mut gnn);
        assert!(feed.contains("HOST8HDR|"));
        assert!(feed.contains("json=0"));
        assert!(!feed.contains('{'));
        assert!(!feed.contains('}'));
    }

    #[test]
    fn parses_observed_frame_from_hbp() {
        let path = std::env::temp_dir().join("host8-observed-frame-test.hbp");
        fs::write(
            &path,
            "CADENCEFRAME|tick=7|phash=f0f0f0f0f0f0f0f0|frame_delta=12|entropy_q=33|pid=ACER-PID-H740C|json=0\n",
        )
        .unwrap();
        let frame = load_observed_frame(path.to_str().unwrap()).unwrap();
        assert_eq!(frame.tick, 7);
        assert_eq!(frame.frame_delta, 12);
        assert_eq!(frame.entropy_q, 33);
        let _ = fs::remove_file(path);
    }
}
