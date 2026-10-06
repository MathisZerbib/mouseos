<p align="center">
  <img src="readme/icon.png" width="96" height="96" alt="MouseOS icon">
</p>

<h1 align="center">MouseOS</h1>

<p align="center">
  <b>Your phone is your computer's mouse.</b><br>
  Trackpad, air mouse, keyboard and remote — for your Mac, Windows PC, Linux computer and your TV.<br>
  Free. No account, no cloud.
</p>

<p align="center">
  <a href="https://github.com/MathisZerbib/mouseos/releases/latest"><img alt="Download for Mac" src="https://img.shields.io/badge/Download-Mac-ff4d00?style=for-the-badge&labelColor=131311&logo=apple&logoColor=white"></a>
  <a href="https://github.com/MathisZerbib/mouseos/releases/latest"><img alt="Download for Windows" src="https://img.shields.io/badge/Download-Windows-ff4d00?style=for-the-badge&labelColor=131311"></a>
  <a href="https://github.com/MathisZerbib/mouseos/releases/latest"><img alt="Download for Linux" src="https://img.shields.io/badge/Download-Linux-ff4d00?style=for-the-badge&labelColor=131311&logo=linux&logoColor=white"></a>
  <a href="https://mathiszerbib.github.io/mouseos/"><img alt="Website" src="https://img.shields.io/badge/Website-mouseos-f2efe8?style=for-the-badge&labelColor=131311"></a>
</p>
<p align="center">
  <img alt="macOS 11 or later, Apple silicon" src="https://img.shields.io/badge/macOS-11%2B%20·%20Apple%20silicon-f2efe8?style=flat-square&labelColor=131311">
  <img alt="Windows 10 and 11, 64-bit" src="https://img.shields.io/badge/Windows-10%20%26%2011-f2efe8?style=flat-square&labelColor=131311">
  <img alt="Linux, X11 or Wayland" src="https://img.shields.io/badge/Linux-X11%20%26%20Wayland-f2efe8?style=flat-square&labelColor=131311">
  <img alt="TVs: Samsung, LG, Google TV" src="https://img.shields.io/badge/TV-Samsung%20·%20LG%20·%20Google%20TV-f2efe8?style=flat-square&labelColor=131311">
  <img alt="Android 8 or later" src="https://img.shields.io/badge/Android-8%2B-f2efe8?style=flat-square&labelColor=131311">
  <img alt="iPhone: soon" src="https://img.shields.io/badge/iPhone-soon-75726b?style=flat-square&labelColor=131311">
  <img alt="Google Play: soon" src="https://img.shields.io/badge/Google%20Play-soon-75726b?style=flat-square&labelColor=131311">
  <img alt="No tracking" src="https://img.shields.io/badge/tracking-none-f2efe8?style=flat-square&labelColor=131311">
</p>

<p align="center"><img src="readme/hero.webp" alt="MouseOS — your phone is your Mac's mouse" width="100%"></p>

## Six screens, one thumb

<p align="center"><img src="readme/screens.webp" alt="The six screens: PAD, AIR, REMOTE, TV, KEYS, SLIDES" width="100%"></p>

## Works with

| Computers | TVs | Phones |
|---|---|---|
| **Mac** — Apple silicon, macOS 11+ ([.dmg](https://github.com/MathisZerbib/mouseos/releases/latest)) | **Samsung** | **Android** 8+ (Google Play, soon) |
| **Windows** — 10 & 11, 64‑bit ([.msi](https://github.com/MathisZerbib/mouseos/releases/latest)) | **LG** | **iPhone** — on the way |
| **Linux** — 64‑bit, X11 or Wayland ([.deb / .rpm](https://github.com/MathisZerbib/mouseos/releases/latest)) | **Google TV** (Sony, TCL, Philips…) | |

## Install — two minutes, once

Start on your computer, finish on your phone. Keep both on the same Wi‑Fi. The pictures show a Mac; Windows and Linux are below.

<p align="center"><img src="readme/install.webp" width="760" alt="The whole setup, animated: Mac app, permission, phone, ALLOW"></p>

<table>
  <tr>
    <td width="50%"><img src="readme/step-1.webp" alt="Privacy &amp; Security, Open Anyway"></td>
    <td width="50%"><img src="readme/step-2.webp" alt="Accessibility, MouseOS switched on"></td>
  </tr>
  <tr>
    <td valign="top"><b>1 · On your Mac — download and open</b><br><a href="https://github.com/MathisZerbib/mouseos/releases/latest">Download MouseOS for Mac</a>, drag it into <b>Applications</b>, open it. The first time, macOS stops it: <b>System Settings → Privacy &amp; Security → Open Anyway</b>.</td>
    <td valign="top"><b>2 · On your Mac — allow control</b><br>Click <b>ALLOW CONTROL</b>, then switch <b>MouseOS</b> on. macOS asks once before any app can move the pointer.</td>
  </tr>
  <tr>
    <td width="50%"><img src="readme/step-3.webp" alt="The phone finds the Mac"></td>
    <td width="50%"><img src="readme/step-4.webp" alt="The phone drives the Mac's pointer"></td>
  </tr>
  <tr>
    <td valign="top"><b>3 · On your phone — open MouseOS</b><br>Install it on your Android phone (Google Play, soon) and open it on the same Wi‑Fi. It finds your Mac by itself.</td>
    <td valign="top"><b>4 · Back on your Mac — click ALLOW</b><br>Once per phone. That's it: your phone is the mouse.</td>
  </tr>
</table>

**On Windows** — run the `.msi` (no admin rights needed). If Windows says it protected your PC: **More info → Run anyway**. The first time MouseOS opens, allow network access, and make sure your Wi‑Fi is a **Private** network. Then steps 3 and 4.

**On Linux** — install the `.deb` (Ubuntu, Debian, Mint) or the `.rpm` (Fedora, openSUSE). On Wayland, click **ALLOW CONTROL** in MouseOS and type your password once; on X11 there's nothing to do. Then steps 3 and 4.

## Private by design

- **No account, no cloud, no tracking.** Phone and Mac talk directly over your Wi‑Fi.
- **Nobody else takes over your computer.** Every new phone needs one ALLOW click on the computer.
- [Privacy policy](https://mathiszerbib.github.io/mouseos/privacy-policy.html)

## Stuck?

- **macOS won't open it** — System Settings → Privacy & Security, scroll down, **Open Anyway**. Only the first time: MouseOS isn't notarized yet.
- **Windows says it protected your PC** — **More info → Run anyway**. Only the first time: MouseOS isn't signed by Microsoft yet.
- **The phone doesn't find the computer** — same Wi‑Fi, VPN off. Café or hotel Wi‑Fi hides devices from each other: turn on your phone's hotspot and join it from the computer, or tap **TYPE THE ADDRESS** on the phone. On Windows, your Wi‑Fi must be a Private network.
- **The pointer doesn't move** — Mac: System Settings → Privacy & Security → Accessibility: switch MouseOS on. Linux on Wayland: open MouseOS and click **ALLOW CONTROL**.

---

<sub>This repository hosts the MouseOS website (<a href="https://mathiszerbib.github.io/mouseos/">mathiszerbib.github.io/mouseos</a>) and the releases for Mac, Windows and Linux.</sub>
