#!/bin/sh
# MouseOS for Linux and the Raspberry Pi, in one command:
#   curl -fsSL https://mouseos.app/linux.sh | sh
# Picks the package for this computer (deb or rpm, x86_64 or arm64), installs it, opens
# its ports when a firewall is on (ufw, firewalld),
# starts MouseOS for the person signed in at the screen (even from SSH), then lets
# the next phone in for 10 minutes, so a computer with no mouse needs no click.
#   … | sh -s -- --trust-all   also lets in every phone after it, without asking
#                              (anyone on the same Wi-Fi could then drive this computer)
# The source: tools/site in MathisZerbib/remote-suite; served at https://mouseos.app/linux.sh.
set -eu

REPO="MathisZerbib/mouseos"
APP=/opt/mouseos/bin/MouseOS
WAIT=10m
TRUST_ALL=false
for a in "$@"; do
  case "$a" in
    --trust-all) TRUST_ALL=true ;;
    --no-wait) WAIT="" ;;
    *) echo "mouseos: unknown option $a (known: --trust-all, --no-wait)" >&2; exit 2 ;;
  esac
done

case "${LC_ALL:-${LANG:-}}" in fr*) FR=true ;; *) FR=false ;; esac
say() { if $FR; then printf '%s\n' "$2"; else printf '%s\n' "$1"; fi; }
die() { say "✗ $1" "✗ $2" >&2; exit 1; }

# ——— root, for the package only ———
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else
  command -v sudo >/dev/null 2>&1 || die "sudo is needed to install the package." "sudo est nécessaire pour installer le paquet."
  SUDO="sudo"
fi

# ——— which package ———
arch="$(uname -m)"
case "$arch" in
  x86_64|amd64) deb=amd64; rpm=x86_64 ;;
  aarch64|arm64) deb=arm64; rpm=aarch64 ;;
  armv7l|armv6l|armhf)
    die "This system is 32-bit. MouseOS needs a 64-bit system: on a Raspberry Pi, install \"Raspberry Pi OS (64-bit)\" with Raspberry Pi Imager." \
        "Ce système est en 32 bits. MouseOS a besoin d'un système 64 bits : sur un Raspberry Pi, installez « Raspberry Pi OS (64-bit) » avec Raspberry Pi Imager." ;;
  *) die "No MouseOS package for $arch." "Pas de paquet MouseOS pour $arch." ;;
esac
# A 64-bit kernel can run a 32-bit system (older Raspberry Pi OS): dpkg tells.
if command -v dpkg >/dev/null 2>&1; then
  [ "$(dpkg --print-architecture)" = "$deb" ] || die \
    "This system is $(dpkg --print-architecture). MouseOS needs a 64-bit system: on a Raspberry Pi, install \"Raspberry Pi OS (64-bit)\"." \
    "Ce système est en $(dpkg --print-architecture). MouseOS a besoin d'un système 64 bits : sur un Raspberry Pi, installez « Raspberry Pi OS (64-bit) »."
  kind=deb; pattern="_${deb}\\.deb"
elif command -v rpm >/dev/null 2>&1; then
  kind=rpm; pattern="\\.${rpm}\\.rpm"
else
  die "Neither apt nor dnf here: download MouseOS from https://mouseos.app" "Ni apt ni dnf ici : téléchargez MouseOS sur https://mouseos.app"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
if [ -n "${MOUSEOS_PACKAGE:-}" ]; then # a package built here (tools/release/linux-install-test.sh)
  file="$tmp/$(basename "$MOUSEOS_PACKAGE")"; cp "$MOUSEOS_PACKAGE" "$file"
else
  command -v curl >/dev/null 2>&1 || die "curl is missing." "curl manque."
  url="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
    | grep -o '"browser_download_url": *"[^"]*"' | sed 's/.*"\(https[^"]*\)"/\1/' | grep -E "$pattern\$" | head -1)" || true
  [ -n "$url" ] || die "Couldn't find the latest MouseOS. Check the internet connection, then try again." \
    "Impossible de trouver la dernière version de MouseOS. Vérifiez la connexion à Internet, puis réessayez."
  file="$tmp/$(basename "$url")"
  say "→ Downloading $(basename "$url")…" "→ Téléchargement de $(basename "$url")…"
  curl -fL# -o "$file" "$url"
fi
chmod 644 "$file"; chmod 755 "$tmp" # apt reads the file as the _apt user
say "→ Installing (your password may be asked)…" "→ Installation (votre mot de passe peut être demandé)…"
if [ "$kind" = deb ]; then
  $SUDO apt-get update -qq >/dev/null 2>&1 || true
  $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$file" >/dev/null
elif command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y -q "$file"
else
  $SUDO zypper --non-interactive install --allow-unsigned-rpm "$file"
fi

# ——— the phone's screen view: ffmpeg (X11), wf-recorder (Wayland on a Pi, sway…) ———
# Each on its own: a distribution without one still gets the other.
if [ "$kind" = deb ]; then
  for extra in ffmpeg wf-recorder; do
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$extra" >/dev/null 2>&1 || true
  done
elif command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y -q ffmpeg-free wf-recorder >/dev/null 2>&1 || $SUDO dnf install -y -q ffmpeg-free >/dev/null 2>&1 || true
fi

# ——— the firewall: phones reach 53317/tcp (link), 53318/udp (pointer), 53319/udp (discovery) ———
# Off on most desktops, but on by default on Fedora (firewalld) and often set up on a Pi (ufw):
# then the phone sees this computer and can't reach it.
if [ -x /usr/lib/mouseos/mouseos-ports ]; then
  $SUDO /usr/lib/mouseos/mouseos-ports open >/dev/null # the package did it already: again is harmless
elif command -v ufw >/dev/null 2>&1 && $SUDO ufw status 2>/dev/null | grep -q '^Status: active'; then
  say "→ Opening MouseOS's ports in the firewall (ufw)…" "→ Ouverture des ports de MouseOS dans le pare-feu (ufw)…"
  # Only from the local networks this computer sits on (192.168.1.0/24…), never from anywhere.
  nets="$(ip -o -4 route show scope link 2>/dev/null | awk '$1 ~ /\// && $3 !~ /^(docker|br-|veth|virbr)/ {print $1}')
$(ip -o -6 route show proto kernel 2>/dev/null | awk '$1 ~ /\// && $1 !~ /^fe80/ && $3 !~ /^(docker|br-|veth|virbr)/ {print $1}')"
  for net in $nets; do
    for p in 53317/tcp 53318/udp 53319/udp; do
      $SUDO ufw allow from "$net" to any port "${p%/*}" proto "${p#*/}" comment MouseOS >/dev/null
    done
  done
elif command -v firewall-cmd >/dev/null 2>&1 && $SUDO firewall-cmd --state >/dev/null 2>&1; then
  say "→ Opening MouseOS's ports in the firewall (firewalld)…" "→ Ouverture des ports de MouseOS dans le pare-feu (firewalld)…"
  for p in 53317/tcp 53318/udp 53319/udp; do
    $SUDO firewall-cmd -q --permanent --add-port="$p" && $SUDO firewall-cmd -q --add-port="$p"
  done
fi

# ——— who MouseOS runs for: the person signed in at the screen ———
# From SSH, that's often not the account typing this (Raspberry Pi: "pi" vs. the desktop user).
session=""; user=""
if command -v loginctl >/dev/null 2>&1; then
  for s in $(loginctl list-sessions --no-legend 2>/dev/null | awk '{print $1}'); do
    t="$(loginctl show-session "$s" -p Type --value 2>/dev/null || true)"
    case "$t" in wayland|x11)
      if [ "$(loginctl show-session "$s" -p Active --value 2>/dev/null)" = yes ]; then
        session="$s"; user="$(loginctl show-session "$s" -p Name --value)"; break
      fi ;;
    esac
  done
fi
if [ -z "$user" ]; then
  say "✓ MouseOS is installed. It starts by itself when someone signs in at this computer's screen." \
      "✓ MouseOS est installé. Il démarre tout seul quand quelqu'un ouvre une session sur l'écran de cet ordinateur."
  say "  No desktop is open right now: turn on automatic login (Raspberry Pi: sudo raspi-config → System Options → Boot / Auto Login → Desktop Autologin), then restart." \
      "  Aucun bureau n'est ouvert pour l'instant : activez la connexion automatique (Raspberry Pi : sudo raspi-config → System Options → Boot / Auto Login → Desktop Autologin), puis redémarrez."
  exit 0
fi
home="$(getent passwd "$user" | cut -d: -f6)"
as_user() {
  if [ "$(id -un)" = "$user" ]; then "$@"
  elif [ -z "$SUDO" ]; then runuser -u "$user" -- env HOME="$home" "$@"
  else sudo -u "$user" -H "$@"; fi
}

prefs="$home/.remote-suite-server.properties"
if $TRUST_ALL; then
  # Read once at start: written before MouseOS (re)starts below.
  as_user sh -c "touch '$prefs' && grep -v '^requireApproval=' '$prefs' > '$prefs.new' || true; echo requireApproval=false >> '$prefs.new' && mv '$prefs.new' '$prefs'"
fi

# ——— start it in that session (a fresh copy, so an update takes over) ———
env_of() { # the desktop's own variables, read from one of the user's programs that has them
  for p in $(pgrep -u "$user" 2>/dev/null); do
    e="$($SUDO cat "/proc/$p/environ" 2>/dev/null | tr '\0' '\n' || true)"
    if printf '%s\n' "$e" | grep -qE '^(WAYLAND_DISPLAY|DISPLAY)='; then
      printf '%s\n' "$e" | grep -E '^(WAYLAND_DISPLAY|DISPLAY|XAUTHORITY|XDG_RUNTIME_DIR|XDG_SESSION_TYPE|XDG_CURRENT_DESKTOP|DBUS_SESSION_BUS_ADDRESS|LANG)='
      return 0
    fi
  done
  return 1
}
vars="$(env_of)" || die "Couldn't reach $user's desktop. Restart the computer: MouseOS starts with it." \
  "Impossible d'atteindre le bureau de $user. Redémarrez l'ordinateur : MouseOS démarre avec lui."
$SUDO pkill -u "$user" -f "^$APP" 2>/dev/null || true
sleep 1
# shellcheck disable=SC2086 # one VAR=value per line on purpose
as_user env $(printf '%s\n' "$vars" | tr '\n' ' ') setsid -f "$APP" --background </dev/null >/dev/null 2>&1 # -f: sudo returns at once, nothing keeps SSH open

say "→ Starting MouseOS for $user…" "→ Démarrage de MouseOS pour $user…"
i=0
until as_user mouseos status >/dev/null 2>&1; do
  i=$((i + 1)); [ "$i" -lt 60 ] || die "MouseOS didn't start. Restart the computer, then run: mouseos status" \
    "MouseOS n'a pas démarré. Redémarrez l'ordinateur, puis lancez : mouseos status"
  sleep 1
done
as_user mouseos status | sed 's/^/  /'

if $TRUST_ALL; then
  say "✓ Ready. Open MouseOS on your phone, on the same Wi-Fi: every phone is let in without asking." \
      "✓ Prêt. Ouvrez MouseOS sur votre téléphone, sur le même Wi-Fi : chaque téléphone entre sans confirmation."
elif [ -n "$WAIT" ]; then
  say "✓ Ready. Open MouseOS on your phone, on the same Wi-Fi, and pick this computer." \
      "✓ Prêt. Ouvrez MouseOS sur votre téléphone, sur le même Wi-Fi, et choisissez cet ordinateur."
  as_user mouseos allow --next "$WAIT" || true
else
  say "✓ Ready. Let a phone in with: mouseos allow --next 2m" "✓ Prêt. Laissez entrer un téléphone avec : mouseos allow --next 2m"
fi
