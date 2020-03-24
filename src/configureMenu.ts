import log = require("loglevel");
import inquirer = require("inquirer");
import {Context} from "./Context";

export async function configureMenu(ctx: Context): Promise<void> {
    while (true) {
        const choices = [`Dry run is: ${ctx.dryRun ? "on" : "off"}`, `Handle existing objects is: ${ctx.alreadyExists}`, "Back"];
        const res = await inquirer.prompt({
            name: "configureMenu",
            type: "list",
            message: "Configuration options:",
            choices: choices
        });
        switch (choices.indexOf(res.configureMenu)) {
            case 0:
                ctx.dryRun = !ctx.dryRun;
                if (ctx.dryRun) {
                    log.info("Dry run is now on. Changes *will not* be made to Lightrail.");
                } else {
                    log.info("Dry run is now off. Changes will be made to Lightrail.");
                }
                break;
            case 1:
                await alreadyExistsMenu(ctx);
                break;
            default:
                return;
        }
    }
}

async function alreadyExistsMenu(ctx: Context): Promise<void> {
    const res = await inquirer.prompt({
        name: "alreadyExists",
        type: "list",
        message: "How would you like to handle objects that already exist in Lightrail?",
        choices: ["skip", "update", "warn", "exit"],
    });
    ctx.alreadyExists = res.alreadyExists;
}
