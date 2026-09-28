"""Tiny local server: serves the camera page and saves recordings to ResearchDrive."""

import json
import os
import re
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

PORT = 8765
HERE = os.path.dirname(os.path.abspath(__file__))


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
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
        if self.path != "/save":
            self.send_error(404)
            return
        folder = unquote(self.headers.get("X-Folder", "")).rstrip("/\\")
        name = unquote(self.headers.get("X-Filename", ""))
        length = int(self.headers.get("Content-Length", 0))

        if ".." in re.split(r"[\\/]", folder):
            return self.reply(400, "Save folder can't contain '..'")

        if os.name == "nt":
            # Windows: save straight to the network path, e.g. \\research.drive.wisc.edu\lab\folder
            drive = os.path.splitdrive(folder)[0]
            if not drive.startswith("\\\\"):
                return self.reply(400, "Save folder must start with \\\\research.drive.wisc.edu\\<lab>")
            if not os.path.isdir(drive + "\\"):
                return self.reply(400, f"ResearchDrive is not connected ({drive} not reachable). Is the VPN on?")
        else:
            # Mac: only allow saving onto a mounted drive under /Volumes, so nothing
            # silently lands on the laptop if ResearchDrive isn't connected.
            parts = folder.split("/")
            if len(parts) < 3 or parts[1] != "Volumes":
                return self.reply(400, "Save folder must start with /Volumes/<drive name>")
            drive = "/".join(parts[:3])
            if not os.path.ismount(drive):
                return self.reply(400, f"ResearchDrive is not connected ({drive} not found). Connect it in Finder and try again.")
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
