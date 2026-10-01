"""Tiny local server: serves the camera page and saves recordings to ResearchDrive."""

import json
import os
import re
import subprocess
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

PORT = 8765
HERE = os.path.dirname(os.path.abspath(__file__))
SAVED_RECORDINGS = set()

# Opens the normal Finder "choose folder" window, in front of the browser.
MAC_PICKER = """
on run argv
  activate
  set start to POSIX file (item 1 of argv)
  try
    return POSIX path of (choose folder with prompt "Pick where to save recordings" default location start)
  on error number -128
    return ""
  end try
end run
"""

# Opens the normal Explorer window to pick a folder (works with \\research.drive.wisc.edu paths).
WINDOWS_PICKER = r"""
Add-Type -AssemblyName System.Windows.Forms
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$d = New-Object System.Windows.Forms.OpenFileDialog
$d.Title = "Open the folder to save recordings in, then click Open"
$d.ValidateNames = $false; $d.CheckFileExists = $false; $d.CheckPathExists = $true
$d.FileName = "Save here"
$d.InitialDirectory = $env:START_FOLDER
$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
if ($d.ShowDialog($owner) -eq "OK") { Split-Path $d.FileName }
"""


def check_folder(folder):
    """Returns why `folder` can't be used for saving, or None if it's fine."""
    if not os.path.isdir(folder):
        return f"Folder not found: {folder}. If it's on ResearchDrive, check it's connected and the VPN is on."
    return None


def pick_folder(start):
    """Shows the system folder picker. Returns the chosen folder, or "" if cancelled."""
    if os.name == "nt":
        cmd = ["powershell", "-NoProfile", "-STA", "-Command", WINDOWS_PICKER]
        env = {**os.environ, "START_FOLDER": start}
    else:
        cmd = ["osascript", "-e", MAC_PICKER, start]
        env = None
    out = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", env=env).stdout
    return out.strip().rstrip("/\\")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/choose-folder":
            start = parse_qs(url.query).get("path", [""])[0]
            # Start in the current folder, or the home folder if it doesn't exist.
            folder = pick_folder(start if os.path.isdir(start) else os.path.expanduser("~"))
            if not folder:
                return self.reply(200, "")
            error = check_folder(folder)
            return self.reply(400, error) if error else self.reply(200, folder)
        if self.path != "/":
            self.send_error(404)
            return
        with open(os.path.join(HERE, "index.html"), "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path == "/reveal":
            target = unquote(self.headers.get("X-Path", ""))
            if target not in SAVED_RECORDINGS:
                return self.reply(403, "Only recordings saved by this app can be revealed.")
            if not os.path.isfile(target):
                return self.reply(404, "Recording not found. Check that the drive is connected.")
            try:
                if os.name == "nt":
                    subprocess.Popen(["explorer.exe", "/select,", os.path.normpath(target)])
                else:
                    subprocess.run(["open", "-R", target], check=True)
            except (OSError, subprocess.SubprocessError) as error:
                return self.reply(500, str(error))
            return self.reply(200, "Opened recording location.")
        if self.path != "/save":
            self.send_error(404)
            return
        folder = unquote(self.headers.get("X-Folder", "")).rstrip("/\\")
        name = unquote(self.headers.get("X-Filename", ""))
        length = int(self.headers.get("Content-Length", 0))

        error = check_folder(folder)
        if error:
            return self.reply(400, error)
        if not re.fullmatch(r"[A-Za-z0-9_-]+", name):
            return self.reply(400, "File name can only contain letters, numbers, - and _")

        os.makedirs(folder, exist_ok=True)

        # Never overwrite an existing recording: add _2, _3, ... instead.
        path = os.path.join(folder, name + ".mp4")
        n = 2
        while os.path.exists(path):
            path = os.path.join(folder, f"{name}_{n}.mp4")
            n += 1

        with open(path, "wb") as f:
            remaining = length
            while remaining > 0:
                chunk = self.rfile.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                f.write(chunk)
                remaining -= len(chunk)

        SAVED_RECORDINGS.add(path)
        self.reply(200, path)

    def reply(self, status, message):
        body = json.dumps({"message": message}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://localhost:{PORT}"
    print(f"Camera app running at {url}  (press Ctrl+C to stop)")
    webbrowser.open(url)
    server.serve_forever()
