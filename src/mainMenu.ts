import inquirer = require("inquirer");
import log = require("loglevel");
import {Context} from "./Context";
import {importContactsMenu} from "./importContacts";

export async function mainMenu(ctx: Context): Promise<void> {
    log.info(
        "                    .:;                 \n" +
        "                   c0x'                 \n" +
        "                  :KWd.                 \n" +
        "                 ;KX0:                  \n" +
        "                ;KMOc.                  \n" +
        "               ,0MWo.                   \n" +
        "              ,0MMXc..........          \n" +
        "             'OMMMWXKKKKKKKKKx.         \n" +
        "            .xNWWWWWWWWWWWWWK:          \n" +
        "            .,,,,,,,,,,,,,,,.           \n" +
        "          .lxxxxxxxxxxxxxxl.            \n" +
        "         .xWMMMMMMMMMMMMMNl             \n" +
        "         .:ccccccccxKNMMNl.             \n" +
        "                   c0NMNo.              \n" +
        "                  .xWWNd.               \n" +
        "                  ,KMWd.                \n" +
        "                  lNNx.                 \n" +
        "                 .kk:.                  \n" +
        "                 ;o.                    \n" +
        "                 ;,  ");
    log.info("Welcome to the Lightrail CSV importer.");

    if (!ctx.apiKey) {
        const res = await inquirer.prompt([{
            name: "apiKey",
            type: "password",
            message: "Enter your Lightrail API key"
        }]);
        ctx.apiKey = res.apiKey;
    }

    await mainMenuLoop(ctx);
}

export async function mainMenuLoop(ctx: Context): Promise<void> {
    while (true) {
        const choices = ["Import Contacts", "Exit"];
        const res = await inquirer.prompt([{
            name: "mainMenu",
            type: "list",
            message: "Make a selection.",
            choices: choices
        }]);
        switch (choices.indexOf(res.mainMenu)) {
            case 0:
                await importContactsMenu(ctx);
                break;
            default:
                return;
        }
    }
}
