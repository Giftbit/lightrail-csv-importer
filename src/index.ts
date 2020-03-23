import log = require("loglevel");
import yargs = require("yargs");
import {mainMenu} from "./mainMenu";
import {Context} from "./Context";

const argv = yargs
    .option("apikey", {
        type: "string",
        describe: "your Lightrail API key"
    })
    .option("verbose", {
        alias: "v",
        type: "boolean",
        describe: "verbose output"
    })
    .help("help")
    .alias("help", "h")
    .epilog("Run with no options for interactive mode.")
    .strict()
    .argv;

if (argv.verbose) {
    log.setLevel(log.levels.DEBUG);
}
log.debug("argv=", argv);

const ctx: Context = {
    apiKey: argv.apikey ?? null
};

const optionsAllowedInInteractive = ["_", "$0", "apikey", "verbose", "v"];
const nonInteractiveOption = Object.keys(argv).find(key => optionsAllowedInInteractive.indexOf(key) === -1);
log.debug("nonInteractiveOption=", nonInteractiveOption);

if (!nonInteractiveOption) {
    log.debug("starting interactive mode");
    mainMenu(ctx)
        .then(() => {
            log.debug("interactive mode complete");
            process.exit();
        })
        .catch(err => {
            log.error("uncaught error:", err);
            process.exit(1);
        });
}
