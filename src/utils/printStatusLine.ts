import log = require("loglevel");
import util = require("util");

/**
 * Giving updates on the progress of long tasks gives confidence that
 * things are working properly.  This script can't do a progress bar because
 * we stream files (good for large file handling!) and don't know how big
 * the file will be.  The next best thing is to output counts of what has
 * happened.
 */
export function printStatusLine(output: any[][], options: {done?: boolean} = {}): void {
    if (log.getLevel() > log.levels.INFO) {
        return;
    }

    // eslint-disable-next-line prefer-spread
    const statusElements = output.map(part => util.format(part[0] + "", ...part.slice(1)));
    const status = statusElements.join(" | ");
    process.stdout.cursorTo(0);
    process.stdout.write(status + " ");
    process.stdout.clearLine(1);
    if (options.done) {
        process.stdout.write("| Done!\n");
    }
}
