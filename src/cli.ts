import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { init } from './init.ts';
import { hashObject } from './hash-object.ts';

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
        async (argv) => await init(argv.path, !!argv.quiet)
    )
    .command(
        'hash-object [file]', 
        'computes the object ID value for an object with specified type with contents of the named file, and optionally writes the resulting object into database', 
            (argv) => {
                return argv
                .positional('file', {
                    describe: 'file to hash',
                    type: 'string',
                    default: ''
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
            },
            async (argv) => await hashObject(argv.file, argv.type)
    )
}


