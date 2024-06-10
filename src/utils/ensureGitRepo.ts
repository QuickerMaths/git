import path from "path";
import fs from 'fs';

export function ensureGitRepo(): string {
  let root = process.cwd();
  let pathToGit: string;

  while (root !== '/') {
    pathToGit = path.join(root, '.git');

    if (fs.existsSync(pathToGit)) {
      return root;
    }
    root = path.dirname(root);
  }

  pathToGit = path.join(root, '.git');
  if (fs.existsSync(pathToGit)) {
    return root;
  }

  process.stderr.write(
    'fatal: not a git repository (or any of the parent directories): .git\r\n'
  );
  process.exit(1);
}

