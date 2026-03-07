from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python.engine.analyzer import analyze_text


def _analyze_file(target: Path) -> int:
    if not target.exists() or not target.is_file():
        print(f"Input file not found: {target}", file=sys.stderr)
        return 1

    text = target.read_text(encoding="utf-8").strip()
    if not text:
        print(f"Input file is empty: {target}", file=sys.stderr)
        return 1

    result = analyze_text(text, title_hint=None)
    print(json.dumps(result, ensure_ascii=False))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="xiaoshuo-engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze = subparsers.add_parser("analyze", help="Analyze a local text file")
    analyze.add_argument("file", type=Path)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "analyze":
        return _analyze_file(args.file)

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
