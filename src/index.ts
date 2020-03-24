import inquirer = require("inquirer");
import lightrail = require("lightrail-client");
import log = require("loglevel");
import yargs = require("yargs");
import {mainMenu} from "./mainMenu";
import {Context} from "./Context";

async function main(): Promise<void> {
    const argv = yargs
        .option("already-exists", {
            type: "string",
            describe: "how to handle objects that already exist in Lightrail",
            choices: ["skip", "update", "warn", "exit"],
            default: "skip"
        })
        .option("api-key", {
            type: "string",
            describe: "your Lightrail API key"
        })
        .option("dry-run", {
            type: "boolean",
            describe: "dry-run the command without making any changes to Lightrail"
        })
        .option("encoding", {
            type: "string",
            describe: "the character encoding of csv files",
            choices: ["ascii", "latin1", "ucs2", "utf16le", "utf8"],
            default: "utf8"
        })
        .option("verbose", {
            alias: "v",
            type: "boolean",
            describe: "verbose output"
        })
        .help("help")
        .alias("help", "h")
        .strict()
        .argv;

    if (argv.verbose) {
        log.setLevel(log.levels.DEBUG);
    } else {
        log.setLevel(log.levels.INFO);
    }
    log.debug("argv=", argv);

    const ctx: Context = {
        alreadyExists: argv["already-exists"] as any,
        dryRun: argv["dry-run"],
        encoding: argv.encoding
    };
    if (!ctx.dryRun) {
        await configureLightrail(argv["api-key"]);
    }

    await mainMenu(ctx);
}

async function configureLightrail(apiKey?: string): Promise<void> {
    try {
        if (!apiKey) {
            const res = await inquirer.prompt({
                name: "apiKey",
                type: "password",
                message: "Enter your Lightrail API key"
            });
            apiKey = res.apiKey;
        }
        if (apiKey && !/eyJ.+\.eyJ.+\..+/.test(apiKey)) {
            log.error("API key does not appear to be valid.");
            process.exit(1);
        }
        lightrail.configure({
            apiKey: apiKey
        });
    } catch (err) {
        throw new Error(`Error configuring Lightrail: ${err.message}`);
    }
}

main()
    .then(() => {
        process.exit();
    })
    .catch(err => {
        log.debug(err);
        log.error(err.message ?? "unknown error");
        process.exit(1);
    });
