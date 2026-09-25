#!/usr/bin/env python3
"""Append TS paper records (read from stdin) before the closing bracket of a seed file."""
import sys
path = sys.argv[1]
block = sys.stdin.read().rstrip() + "\n"
s = open(path).read()
idx = s.rstrip().rfind("]")
assert idx > 0
s = s[:idx].rstrip("\n") + "\n" + block + "]\n"
open(path, "w").write(s)
print("appended to", path)
