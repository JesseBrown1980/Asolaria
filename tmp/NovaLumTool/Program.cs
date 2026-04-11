using System.IO.Ports;
using System.Text;
using System.Text.Json;

const byte STX = 0x02;
const byte ACK = 0x06;
const byte HASH = 0x23;
const byte CTRL_C = 0x03;

var opts = ParseArgs(args);
if (!opts.TryGetValue("mode", out var mode))
{
    throw new ArgumentException("--mode read|write is required");
}

var portName = opts.TryGetValue("port", out var p) ? p : "COM9";

using var port = new SerialPort(portName, 115200, Parity.None, 8, StopBits.One)
{
    ReadTimeout = 1200,
    WriteTimeout = 1200,
    Handshake = Handshake.None,
    DtrEnable = false,
    RtsEnable = false
};

port.Open();
Thread.Sleep(200);
port.DiscardInBuffer();
port.DiscardOutBuffer();
EnterBinaryMode(port);

if (mode == "read")
{
    var response = ReadGlobals(port);
    if (opts.TryGetValue("hex", out var hexOut))
    {
        File.WriteAllText(hexOut, ToHex(response));
    }
    if (opts.TryGetValue("json", out var jsonOut))
    {
        var parsed = ParseGlobals(response);
        File.WriteAllText(jsonOut, JsonSerializer.Serialize(parsed, new JsonSerializerOptions { WriteIndented = true }));
    }
    Console.WriteLine($"read {response.Length} bytes");
    return;
}

if (mode == "write")
{
    if (!opts.TryGetValue("current", out var currentJsonPath) || !opts.TryGetValue("patch", out var patchJsonPath))
    {
        throw new ArgumentException("--current and --patch are required for write");
    }

    var currentResponse = ReadGlobals(port);
    var parsedCurrent = ParseGlobals(currentResponse);
    var patchDoc = JsonDocument.Parse(File.ReadAllText(patchJsonPath));
    ApplyPatch(parsedCurrent, patchDoc.RootElement);

    var packet = BuildWritePacket(currentResponse, parsedCurrent);
    if (opts.TryGetValue("writehex", out var writeHexPath))
    {
        File.WriteAllText(writeHexPath, ToHex(packet));
    }

    var response = SendPacket(port, packet);
    if (opts.TryGetValue("response", out var responsePath))
    {
        File.WriteAllText(responsePath, ToHex(response));
    }

    Thread.Sleep(600);
    var verify = ReadGlobals(port);
    if (opts.TryGetValue("verifyhex", out var verifyHexPath))
    {
        File.WriteAllText(verifyHexPath, ToHex(verify));
    }
    if (opts.TryGetValue("verifyjson", out var verifyJsonPath))
    {
        var parsedVerify = ParseGlobals(verify);
        File.WriteAllText(verifyJsonPath, JsonSerializer.Serialize(parsedVerify, new JsonSerializerOptions { WriteIndented = true }));
    }
    Console.WriteLine($"write response {ToHex(response)}");
    return;
}

throw new ArgumentException($"Unknown mode {mode}");

static Dictionary<string, string> ParseArgs(string[] args)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i < args.Length; i++)
    {
        if (!args[i].StartsWith("--", StringComparison.Ordinal)) continue;
        var key = args[i][2..];
        var value = i + 1 < args.Length ? args[i + 1] : "";
        result[key] = value;
        i++;
    }
    return result;
}

static void EnterBinaryMode(SerialPort port)
{
    port.DiscardInBuffer();
    port.DiscardOutBuffer();
    // IX-459 wake-byte fix 2026-04-06: send Ctrl-C (0x03) first to wake the unit,
    // settle 150ms, discard any echo, THEN send the binary mode hash (0x23).
    // The CTRL_C constant at line 8 was the original intent — this restores it.
    // Verified working in the .ps1 sibling tool against COM10 (708 bytes returned).
    port.Write(new[] { (char)CTRL_C }, 0, 1);
    System.Threading.Thread.Sleep(150);
    port.DiscardInBuffer();
    port.Write(new[] { (char)HASH }, 0, 1);
    _ = ReadAvailable(port, 1200);
}

static byte[] ReadGlobals(SerialPort port)
{
    port.DiscardInBuffer();
    port.DiscardOutBuffer();
    var cmd = new byte[] { STX, 0x30, 0x00, 0x00 };
    port.Write(cmd, 0, cmd.Length);
    var first = ReadAvailable(port, 2200);
    if (first.Length == 1 && first[0] == ACK)
    {
        return ReadAvailable(port, 1800);
    }
    if (first.Length > 1 && first[0] == ACK)
    {
        return first[1..];
    }
    return first;
}

static byte[] SendPacket(SerialPort port, byte[] packet)
{
    port.DiscardInBuffer();
    port.DiscardOutBuffer();
    port.Write(packet, 0, packet.Length);
    return ReadAvailable(port, 2500);
}

static byte[] ReadAvailable(SerialPort port, int totalWaitMs)
{
    var bytes = new List<byte>();
    var end = DateTime.UtcNow.AddMilliseconds(totalWaitMs);
    while (DateTime.UtcNow < end)
    {
        Thread.Sleep(80);
        var available = port.BytesToRead;
        while (available > 0)
        {
            var buffer = new byte[available];
            var read = port.Read(buffer, 0, buffer.Length);
            if (read > 0) bytes.AddRange(buffer.Take(read));
            available = port.BytesToRead;
        }
    }
    return bytes.ToArray();
}

static string ToHex(byte[] bytes) => Convert.ToHexString(bytes).ToLowerInvariant();

static Dictionary<string, object> ParseGlobals(byte[] packet)
{
    if (packet.Length < 4 || packet[0] != STX || packet[1] != 0x30)
    {
        throw new InvalidOperationException($"Unexpected globals packet header: {ToHex(packet.Take(Math.Min(packet.Length, 16)).ToArray())}");
    }

    string ByteString(int start, int length)
    {
        var sb = new StringBuilder();
        for (var i = start; i < start + length && i < packet.Length; i++)
        {
            var b = packet[i];
            if (b == 0x00 || b == 0xFF) break;
            if (b >= 32 && b <= 126) sb.Append((char)b);
        }
        return sb.ToString().Trim();
    }

    string ValueString(int start, int length) => ByteString(start, length);
    int ByteVal(int start) => start < packet.Length ? packet[start] : 0;

    return new Dictionary<string, object>
    {
        ["serialNum"] = ByteString(4 + 75, 6),
        ["wifi_ssid"] = ByteString(4 + 260, 33),
        ["wifi_psk"] = ByteString(4 + 293, 64),
        ["wifi_auth"] = ValueString(4 + 485, 2),
        ["wifi_band"] = ValueString(4 + 487, 2),
        ["wifi_StaticIpAddr"] = ByteString(4 + 515, 16),
        ["wifi_IpNetMask"] = ByteString(4 + 531, 16),
        ["wifi_IpGateway"] = ByteString(4 + 547, 16),
        ["bUseStaticSsidIpAddress"] = ByteVal(4 + 569).ToString(),
        ["securityMode"] = ByteVal(4 + 571),
        ["uNetworkType"] = ByteVal(4 + 573),
        ["sync_port"] = ByteString(4 + 575, 6),
        ["sync_server"] = ByteString(4 + 581, 90),
        ["wifi_DNS1"] = ValueString(4 + 671, 16),
        ["wifi_DNS2"] = ValueString(4 + 687, 16)
    };
}

static void ApplyPatch(Dictionary<string, object> current, JsonElement patch)
{
    foreach (var prop in patch.EnumerateObject())
    {
        current[prop.Name] = prop.Value.ValueKind switch
        {
            JsonValueKind.Number => prop.Value.GetInt32(),
            JsonValueKind.String => prop.Value.GetString() ?? "",
            JsonValueKind.True => "1",
            JsonValueKind.False => "0",
            _ => prop.Value.ToString()
        };
    }
}

static byte[] BuildWritePacket(byte[] currentReadResponse, Dictionary<string, object> next)
{
    // Current response includes 4-byte header + payload. We preserve payload bytes and only patch targeted fields.
    var payloadLen = currentReadResponse.Length - 4;
    if (payloadLen <= 0) throw new InvalidOperationException("Invalid current globals response length.");
    var payload = new byte[payloadLen];
    Array.Copy(currentReadResponse, 4, payload, 0, payloadLen);

    void WriteByteString(int offset, int length, string value)
    {
        var bytes = Encoding.ASCII.GetBytes(value ?? "");
        Array.Clear(payload, offset, length);
        Array.Copy(bytes, 0, payload, offset, Math.Min(bytes.Length, length));
    }

    void WriteValueString(int offset, int length, string value) => WriteByteString(offset, length, value);
    void WriteByteValue(int offset, byte value) => payload[offset] = value;

    if (next.TryGetValue("wifi_ssid", out var ssid)) WriteByteString(260, 33, ssid.ToString() ?? "");
    if (next.TryGetValue("wifi_psk", out var psk)) WriteByteString(293, 64, psk.ToString() ?? "");
    if (next.TryGetValue("wifi_auth", out var auth)) WriteValueString(485, 2, auth.ToString() ?? "");
    if (next.TryGetValue("wifi_band", out var band)) WriteValueString(487, 2, band.ToString() ?? "");
    if (next.TryGetValue("wifi_StaticIpAddr", out var ip)) WriteByteString(515, 16, ip.ToString() ?? "");
    if (next.TryGetValue("wifi_IpNetMask", out var mask)) WriteByteString(531, 16, mask.ToString() ?? "");
    if (next.TryGetValue("wifi_IpGateway", out var gw)) WriteByteString(547, 16, gw.ToString() ?? "");
    if (next.TryGetValue("bUseStaticSsidIpAddress", out var useStatic)) WriteByteValue(569, Convert.ToByte(useStatic.ToString()));
    if (next.TryGetValue("securityMode", out var secMode)) WriteByteValue(571, Convert.ToByte(secMode));
    if (next.TryGetValue("uNetworkType", out var netType)) WriteByteValue(573, Convert.ToByte(netType));
    if (next.TryGetValue("sync_port", out var port)) WriteByteString(575, 6, port.ToString() ?? "");
    if (next.TryGetValue("sync_server", out var host)) WriteByteString(581, 90, host.ToString() ?? "");
    if (next.TryGetValue("wifi_DNS1", out var dns1)) WriteValueString(671, 16, dns1.ToString() ?? "");
    if (next.TryGetValue("wifi_DNS2", out var dns2)) WriteValueString(687, 16, dns2.ToString() ?? "");

    var payloadWithIndex = new byte[payload.Length + 2];
    payloadWithIndex[0] = 0x00;
    payloadWithIndex[1] = 0x00;
    Array.Copy(payload, 0, payloadWithIndex, 2, payload.Length);

    byte checksum = 0x00;
    foreach (var b in payloadWithIndex) checksum += b;

    var totalLen = payloadWithIndex.Length + 1;
    var packet = new byte[4 + payloadWithIndex.Length + 1];
    packet[0] = STX;
    packet[1] = 0x32;
    packet[2] = (byte)((totalLen >> 8) & 0xff);
    packet[3] = (byte)(totalLen & 0xff);
    Array.Copy(payloadWithIndex, 0, packet, 4, payloadWithIndex.Length);
    packet[^1] = checksum;
    return packet;
}
