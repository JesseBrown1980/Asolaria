# Index the two new findings into the appropriate axis cube indexes
$root = 'C:\Users\acer\Asolaria'

function Append-Cube {
    param($axis, $cube, $dim, $entry)
    $cubeDir = Join-Path $root "data\cubes\$axis-$cube"
    if (-not (Test-Path $cubeDir)) { New-Item -ItemType Directory -Force -Path $cubeDir | Out-Null }
    $indexPath = Join-Path $cubeDir 'index.ndjson'
    Add-Content -Path $indexPath -Value ($entry | ConvertTo-Json -Compress)
}

# Finding 1: ReSono Labs Syntax → tool axis (primary D15)
$f1Tool = @{
    ts = '2026-04-07T22:15:00Z'
    event = 'EXTERNAL_TOOL_FINDING'
    cube = 3375; dim = 'D15_DEVICE'
    file = '2026-04-07-resono-labs-syntax-finding.json'
    bytes = (Get-Item "$root\data\findings\2026-04-07-resono-labs-syntax-finding.json").Length
    local_path = "$root\data\findings\2026-04-07-resono-labs-syntax-finding.json"
    name = 'ReSono Labs Syntax (ESP32-S3 voice device firmware)'
    url = 'https://github.com/ReSono-Labs/ReSonoLabs_Syntax'
    license = 'PolyForm Noncommercial 1.0.0'
    axis_map_version = 'v1.2'
    ref = 'LX-493_CANDIDATE'
}
Append-Cube 'tool' 3375 'D15_DEVICE' $f1Tool

# Same finding indexed into pattern axis (secondary — structural twin pattern)
$f1Pattern = @{
    ts = '2026-04-07T22:15:00Z'
    event = 'EXTERNAL_PATTERN_FINDING'
    cube = 29791; dim = 'D11_PROOF'; subtype = 'pattern'
    file = '2026-04-07-resono-labs-syntax-finding.json'
    bytes = (Get-Item "$root\data\findings\2026-04-07-resono-labs-syntax-finding.json").Length
    local_path = "$root\data\findings\2026-04-07-resono-labs-syntax-finding.json"
    name = 'OpenClaw device-bridge namespace = structural twin of asolaria federation primitives'
    pattern_evidence = 'independent_convergence'
    axis_map_version = 'v1.2'
    ref = 'LX-493_CANDIDATE'
}
Append-Cube 'pattern' 29791 'D11_PROOF' $f1Pattern

# Same finding indexed into reference axis (tertiary — external pointer)
$f1Ref = @{
    ts = '2026-04-07T22:15:00Z'
    event = 'EXTERNAL_REFERENCE'
    cube = 10648; dim = 'D22_TRANSLATION'
    file = '2026-04-07-resono-labs-syntax-finding.json'
    name = 'ReSono Labs Syntax + OpenClaw Bridge'
    url = 'https://github.com/ReSono-Labs/ReSonoLabs_Syntax'
    paired_url = 'https://github.com/ReSono-Labs/ReSono-Labs-OpenClaw-Bridge'
    axis_map_version = 'v1.2'
}
Append-Cube 'reference' 10648 'D22_TRANSLATION' $f1Ref

# Finding 2: AI News video → reference axis only
$f2 = @{
    ts = '2026-04-07T22:15:00Z'
    event = 'EXTERNAL_REFERENCE'
    cube = 10648; dim = 'D22_TRANSLATION'
    file = '2026-04-07-ai-news-video-finding.json'
    bytes = (Get-Item "$root\data\findings\2026-04-07-ai-news-video-finding.json").Length
    local_path = "$root\data\findings\2026-04-07-ai-news-video-finding.json"
    name = "Google's open-source AI, Claude Code leaked, new Wan, new Qwen, image gen on phone: AI NEWS"
    url = 'https://www.youtube.com/watch?v=o5rGuknRw2A'
    channel = 'AI Search (@theAIsearch)'
    headline_topics = @('google_open_source_AI', 'claude_code_leaked', 'new_wan', 'new_qwen', 'image_gen_on_phone')
    transcript_status = 'NOT_FETCHED'
    axis_map_version = 'v1.2'
}
Append-Cube 'reference' 10648 'D22_TRANSLATION' $f2

# Mirror findings to D
$dFindings = 'D:\safety-backups\session-20260407-asolaria\findings'
New-Item -ItemType Directory -Force -Path $dFindings | Out-Null
Copy-Item "$root\data\findings\*" $dFindings -Force

# Mirror updated cube indexes
$dCubes = 'D:\safety-backups\session-20260407-asolaria\cubes'
foreach ($axis in @('tool', 'pattern', 'reference')) {
    $cubeMap = @{ 'tool'=3375; 'pattern'=29791; 'reference'=10648 }
    $src = Join-Path $root "data\cubes\$axis-$($cubeMap[$axis])"
    $dst = Join-Path $dCubes "$axis-$($cubeMap[$axis])"
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    robocopy $src $dst /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
}

Write-Host "DONE: 4 cube index records added (tool, pattern, reference x2), findings mirrored to D"
Write-Host "tool/3375: +1 (resono firmware)"
Write-Host "pattern/29791: +1 (structural twin pattern)"
Write-Host "reference/10648: +2 (resono pair + ai news video)"
