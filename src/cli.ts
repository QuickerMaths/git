import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { hashObject } from './commands/hash-object';
import { init } from './commands/init';
import { ensureGitRepo } from './utils/ensureGitRepo';

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
