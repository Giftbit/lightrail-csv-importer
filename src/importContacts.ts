import inquirer = require("inquirer");
import log = require("loglevel");
import {Context} from "./Context";
import {fileExists, scanForFiles} from "./fileUtils";

export async function importContactsMenu(ctx: Context): Promise<void> {
    const recommendedFiles = await scanForFiles({extension: "csv"});
    log.info("recommendedFiles=", recommendedFiles);

    const res = await inquirer.prompt([{
        name: "importContacts",
        type: "string",
        default: recommendedFiles?.[0],
        message: "Enter the name of the csv file to import (blank to exit):"
    }]);
    const csvFilename: string = res.importContacts;
    log.debug("csvFilename=", res.importContacts);
    if (!csvFilename) {
        return;
    }

    if (!await fileExists(csvFilename)) {
        log.info("Could not find file", csvFilename, ". Does the file exist?  Is the path correct?");
        return;
    }

    log.info("Import CSV file", csvFilename);
}

export async function importContacts(ctx: Context): Promise<void> {

}
