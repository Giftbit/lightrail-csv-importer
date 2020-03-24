import log = require("loglevel");
import inquirer = require("inquirer");
import {Context} from "./Context";
import {importContactsMenu} from "./importContacts";
import {importValuesMenu} from "./importValues";

export async function mainMenu(ctx: Context): Promise<void> {
    while (true) {
        const choices = [`Toggle dry run (currently ${ctx.dryRun ? "on" : "off"})`, "Import Contacts", "Import Values", "Exit"];
        const res = await inquirer.prompt({
            name: "mainMenu",
            type: "list",
            message: "What would you like to do?",
            choices: choices
        });
        switch (choices.indexOf(res.mainMenu)) {
            case 0:
                ctx.dryRun = !ctx.dryRun;
                if (ctx.dryRun) {
                    log.info("Dry run is now on. Changes *will not* be made to Lightrail.");
                } else {
                    log.info("Dry run is now off. Changes will be made to Lightrail.");
                }
                break;
            case 1:
                await importContactsMenu(ctx);
                break;
            case 2:
                await importValuesMenu(ctx);
                break;
            default:
                return;
        }
    }
}
