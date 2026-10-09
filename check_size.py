"""Check the entire installed project, including dependencies and learning data."""
import os
from pathlib import Path

root = Path(__file__).resolve().parent
totals = {}
for directory, dirs, files in os.walk(root, followlinks=False):
    for name in dirs + files:
        path = Path(directory) / name
        if path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction()):
            raise SystemExit(f'Cannot verify size through a link: {path}')
    for name in files:
        path = Path(directory) / name
        group = path.relative_to(root).parts[0]
        totals[group] = totals.get(group, 0) + path.stat().st_size
total = sum(totals.values())
for group, size in sorted(totals.items(), key=lambda item: -item[1])[:10]:
    print(f'{size / 1_000_000:8.2f} MB  {group}')
print(f'Total: {total / 1_000_000:.2f} MB ({total / 2**20:.2f} MiB); limit: 100 MB')
raise SystemExit(0 if total <= 100_000_000 else 1)
