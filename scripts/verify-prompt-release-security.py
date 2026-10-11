"""Run the template security checks without interpreting verified raster files as text.

The template's worktree concatenation decodes binary assets with errors='ignore',
which makes thousands of images a huge fake source diff. Keep every filename and
size check, and apply secret checks to each UTF-8 source file independently.
"""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    'template_security', '.claude/skills/security-scan/scripts/scan_staged.py'
)
scan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scan)
root = Path(scan.git('rev-parse', '--show-toplevel').strip())
files = sorted(set(scan.git('diff', 'HEAD', '--name-only').splitlines()
                   + scan.git('ls-files', '--others', '--exclude-standard').splitlines()))
scan.check_staged_filenames(files)
scan.check_secrets(scan.git('diff', 'HEAD', '--unified=0', '--no-color'))
texts = 0
rasters = 0
for name in scan.git('ls-files', '--others', '--exclude-standard').splitlines():
    file = root / name
    # Only the separately decoded/hash-verified prompt example raster directory.
    if name.startswith('public/imgs/prompt-library/') and file.suffix in ('.jpg', '.png', '.webp'):
        rasters += 1
        continue
    try:
        content = file.read_text(encoding='utf-8')
    except (OSError, UnicodeDecodeError):
        continue
    diff = f'\n+++ b/{name}\n@@ -0,0 +1 @@\n' + '\n'.join('+' + line for line in content.splitlines())
    scan.check_secrets(diff)
    texts += 1
scan.check_gitignore_coverage()
scan.check_tracked_files()
scan.check_dockerignore(root)
scan.check_file_sizes(files, root)
for level, location, message in scan.findings:
    print(f'{level}: {location}: {message}')
print(f'Checked {len(files)} changed files; {texts} untracked text files; {rasters} raster assets verified separately; findings: {len(scan.findings)}')
sys.exit(1 if any(level == 'HIGH' for level, _, _ in scan.findings) else 0)
