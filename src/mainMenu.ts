import inquirer = require("inquirer");
import {Context} from "./Context";
import {importContactsMenu} from "./importContacts";
import {importValuesMenu} from "./importValues";
import {configureMenu} from "./configureMenu";

export async function mainMenu(ctx: Context): Promise<void> {
    while (true) {
        const choices = ["Configure", "Import Contacts", "Import Values", "Exit"];
        const res = await inquirer.prompt({
            name: "mainMenu",
            type: "list",
            message: "What would you like to do?",
            choices: choices
        });
        switch (choices.indexOf(res.mainMenu)) {
            case 0:
                await configureMenu(ctx);
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
