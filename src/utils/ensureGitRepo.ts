import path from "path";
import { exists } from "./exists";

export async function ensureGitRepo(): Promise<string> {
  let root = process.cwd();
  let pathToGit: string;

  while (root !== '/') {
    pathToGit = path.join(root, '.git');

    if (await exists(pathToGit)) {
      return root;
    }
    root = path.dirname(root);
  }

  pathToGit = path.join(root, '.git');
  if (await exists(pathToGit)) {
    return root;
  }

  process.stderr.write(
    'fatal: not a git repository (or any of the parent directories): .git\r\n'
  );
  process.exit(1);
}

