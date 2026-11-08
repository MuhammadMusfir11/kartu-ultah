#!/usr/bin/env python3
"""Server ucapan ulang tahun. Jalankan: python app.py  ->  http://localhost:8000
Yang diedit cukup config.py dan folder media/. Perubahan config.py langsung terbaca saat refresh."""
import importlib, json, mimetypes, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import config

mimetypes.add_type("text/javascript", ".js")   # penting di Windows, kalau tidak JS modul gagal dimuat
mimetypes.add_type("text/css", ".css")

BASE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(BASE, "media"), exist_ok=True)


def config_json():
    importlib.reload(config)                    # baca ulang config.py setiap kali
    return json.dumps(config.CONFIG, ensure_ascii=False).encode("utf-8")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=BASE, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")   # jangan simpan cache di browser
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/config.json":
            try:
                data = config_json()
            except Exception as e:                       # misal ada salah ketik di config.py
                print("Error di config.py:", e)
                self.send_error(500, "config.py error")
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif path in ("/", "/index.html"):
            self.path = "/index.html"
            super().do_GET()
        elif path.startswith(("/static/", "/media/")):
            super().do_GET()
        else:
            self.send_error(404)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"Berjalan di http://localhost:{config.PORT}  (tekan Ctrl+C untuk berhenti)")
    ThreadingHTTPServer(("0.0.0.0", config.PORT), Handler).serve_forever()