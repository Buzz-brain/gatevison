import os
import sys
from pathlib import Path

os.environ["DATABASE_NAME"] = "gatevision_smoke"
os.environ["LOG_DIR"] = "logs_smoke"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import threading

import uvicorn
from uvicorn import Config, Server


def main() -> None:
    config = Config("app.main:app", host="127.0.0.1", port=8001, log_level="warning")
    server = Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    import smoke_finalize

    code = smoke_finalize.main(8001)

    server.should_exit = True
    thread.join(timeout=15)
    raise SystemExit(code)


if __name__ == "__main__":
    main()
