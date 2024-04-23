import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { init } from './init.ts';
import { hashObject } from './hash-object.ts';

export function cli(args: string[]) {
    return yargs(hideBin(args))
    .command('init [path]', 'initalizes empty git repository',
    (argv) => {
        return argv.positional('path', {
            describe: 'path to initialize git repository, defaults to current directory',
            default: '.'
        })
    }, 
    async (argv) => await init(argv.path, !!argv.quiet))
    .option('quiet', {
        alias: 'q',
        type: 'boolean',
        description: 'Print only error messages.',
        default: false
    })
    .command(
        'hash-object', 
        'computes the object ID value for an object with specified type with contents of the named file, and optionally writes the resulting object into database', 
        (_argv) => {},
        async (_argv) => await hashObject()
    )
    .option('write', {
        alias: 'w',
        type: 'boolean',
        description: 'Actually write the object into the database',
        default: false
    })
    .demandCommand(1)
}


