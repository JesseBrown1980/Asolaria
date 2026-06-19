# POST-REBOOT RESUME — Xiaomi Recovery

## O QUE ACONTECEU
O Zadig instalou o driver **libusbK v3.1.0.0** no Xiaomi Mi 10 Lite 5G (VID 2717 / PID FF40).
O Windows pediu reboot para aplicar. O reboot foi executado com shutdown seguro.

## IMEDIATAMENTE APÓS REBOOT, FAZER:

### Passo 1 — Verificar driver
```powershell
Get-PnpDevice -InstanceId "USB\VID_2717&PID_FF40\56C90D22" | Select-Object FriendlyName, Class, Status
# ESPERADO: Class NÃO deve ser WPD. Deve ser USBDevice ou libusbK.
```

### Passo 2 — Lançar scrcpy --otg
```bash
scrcpy --otg
```
Uma janela vai abrir. O teclado do PC agora é o teclado do Xiaomi.

### Passo 3 — Digitar PIN do Xiaomi
- Aperta ESPAÇO ou ENTER para acordar a tela
- Digita o PIN numérico + ENTER
- O Xiaomi desbloqueia (mesmo sem ver a tela)

### Passo 4 — Ativar depuração USB
- Se "Ok Google" estiver ativo, diz "Ok Google, abrir opções de desenvolvedor"
- Ou navega com TAB + ENTER:
  - HOME (tecla Windows ou botão Home)
  - Swipe down = não funciona com teclado. Tenta: procurar "desenvolvedor" na busca MIUI

### Passo 5 — Conectar ADB
```bash
# Restaurar driver MTP primeiro (Device Manager > Xiaomi > Update Driver > Let Windows choose)
# Ou: scrcpy com ADB normal depois de ativar debugging
adb devices -l
```

### Passo 6 — Backup ANTES de qualquer coisa
```bash
mkdir C:\Users\rayss\xiaomi-backup
adb -s <XIAOMI_SERIAL> pull /sdcard/ C:\Users\rayss\xiaomi-backup\
```

### Passo 7 — Integrar no Asolaria
- Registrar como segundo nó phone
- Instalar Termux + MQTT client
- Configurar scrcpy para controle remoto

## SE O DRIVER NÃO MUDOU APÓS REBOOT
O Zadig pode ter instalado no Samsung por engano. Nesse caso:
1. Abrir Zadig (C:\Users\rayss\xiaomi-recover\zadig-2.9.exe)
2. Options > List All Devices
3. Selecionar "Mi 10 Lite 5G" no dropdown (agora deve aparecer)
4. Target: WinUSB ou libusbK
5. Replace Driver
6. Rodar scrcpy --otg

## ARQUIVOS CRIADOS NESTA SESSÃO
- xiaomi-recover/liris_usb_inject.py — 7-vector USB injection v1
- xiaomi-recover/liris_inject_v2.py — 7-vector Windows native v2
- xiaomi-recover/shannon_recovery.py — Shannon 5-phase pipeline
- xiaomi-recover/shannon_exploit.py — The Key Swap (timing attack)
- xiaomi-recover/aoa_inject.py — Direct WinUSB AOA via ctypes
- xiaomi-recover/key_swap.ps1 — MTP disable + scrcpy race
- xiaomi-recover/zadig_final.py — Zadig GUI automation (the one that worked!)
- xiaomi-recover/zadig-2.9.exe — Zadig installer
- xiaomi-recover/xiaomi_adb.inf — Custom WinUSB INF (unsigned)
- xiaomi-recover/xiaomi_winusb.inf — Alt WinUSB INF
- xiaomi-recover/reports/ — Shannon pipeline reports

