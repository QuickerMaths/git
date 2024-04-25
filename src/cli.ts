import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'node:path';
import fs from 'fs/promises';
import { hashObject } from './commands/hash-object';
import { init } from './commands/init';

async function exists(path: string) {
    try {
        await fs.access(path)
        return true
    } catch {
        return false
    }
}

async function ensureGitRepo(): Promise<string> {
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

async function commandWrapper(callback: () => Promise<string | string[] | undefined | void>) {
    try {
        const output = await callback();
        if(output) {
            if(Array.isArray(output)) {
                output.forEach((line) => process.stdout.write(line + '\n'));
            } else {
                process.stdout.write(output + '\n');
            }
        } 
        process.exit(0);
    } catch(error) {
        const e = error as Error;
        process.stderr.write(e.message);
        process.exit(1);
    }
}

export function cli(args: string[]) {
    return yargs(hideBin(args))
    .command(
        'init [path]', 
        'initalizes empty git repository',
        (argv) => {
            return argv
            .positional('path', {
                describe: 'path to initialize git repository, defaults to current directory',
                default: '.'
            })
            .option('quiet', {
                alias: 'q',
                type: 'boolean',
                description: 'Print only error messages.',
                default: false
            })
        }, 
        async (argv) => await commandWrapper(() => init(argv.path, argv.quiet)) 
    )
    .command(
        'hash-object [files..]', 
        'computes the object ID value for an object with specified type with contents of the named files or stdin if --stdin option is invoked, and optionally writes the resulting objects into database', 
            (argv) => {
                return argv
                .positional('files', {
                    describe: 'files to hash',
                    default: [] 
                })
                .option('type', {
                    alias: 't',
                    type: 'string',
                    description: 'specifies type (blob | commit | tree | tag). Defaults to blob.',
                    default: 'blob'
                })
                .option('write', {
                    alias: 'w',
                    type: 'boolean',
                    description: 'actually write the object into the database',
                    default: false
                })
                .option('stdin', {
                    type: 'boolean',
                    description: 'read the object from standard input instead of the file',
                    defualt: false
                })
            },
            async (argv) => {
                const gitRoot = await ensureGitRepo()
                await commandWrapper(() => hashObject(gitRoot, argv.files, argv.type, argv.write, !!argv.stdin))
            }
    )
}
