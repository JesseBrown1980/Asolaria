foreach ($id in 13068,18140,18208,38788) {
  try {
    $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$id"
    if ($cim) {
      "pid=$id name=$($cim.Name) parent=$($cim.ParentProcessId)"
      "  cmdline: $($cim.CommandLine)"
    }
  } catch {}
}
