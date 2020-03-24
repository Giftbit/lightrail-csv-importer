import inquirer = require("inquirer");
import {Context} from "./Context";
import {importContactsMenu} from "./importContacts";
import {deleteContacts} from "./deleteContacts";

export async function mainMenu(ctx: Context): Promise<void> {
    while (true) {
        const choices = ["Import Contacts", "Delete all Contacts", "Exit"];
        const res = await inquirer.prompt([{
            name: "mainMenu",
            type: "list",
            message: "What would you like to do?",
            choices: choices
        }]);
        switch (choices.indexOf(res.mainMenu)) {
            case 0:
                await importContactsMenu(ctx);
                break;
            case 1:
                await deleteContacts(ctx);
                break;
            default:
                return;
        }
    }
}
