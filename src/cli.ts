import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'

export function cli(args: string[]) {
    return yargs(hideBin(args))
    .command('curl <url>', 'fetch the contents of the URL', () => {}, (argv) => {
        console.info(argv)
    })
    .demandCommand(1)
}

