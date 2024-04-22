import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { init } from './init.ts';

export function cli(args: string[]) {
    return yargs(hideBin(args))
    .command('init [path]', 'initalizes empty git repository',
    (argv) => {
        return argv.positional('path', {
            describe: 'path to initialize git repository, defaults to current directory',
            default: '.'
        })
    }, 
    async (argv) => {
        await init(argv.path, argv.quiet)
    })
    .option('quiet', {
        alias: 'q',
        type: 'boolean',
        description: 'Print only error messages.',
        default: false
    })
    .demandCommand(1)
}


