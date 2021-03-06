import lightrail = require("lightrail-client");
import inquirer = require("inquirer");
import log = require("loglevel");
import {Context} from "./Context";
import {fileExists, parseCsvHeader, scanForFiles, streamCsv} from "./utils/fileUtils";
import {inquireCsvHeaderFields} from "./utils/inquirerUtils";
import {printStatusLine} from "./utils/printStatusLine";

export async function importContactsMenu(ctx: Context): Promise<void> {
    const recommendedFiles = await scanForFiles({extension: "csv"});
    log.debug("recommendedFiles=", recommendedFiles);

    const csvFilenameRes = await inquirer.prompt({
        name: "importContacts",
        type: "input",
        default: recommendedFiles?.[0],
        message: "Enter the name of the csv file to import:"
    });
    const csvFilename: string = csvFilenameRes.importContacts;
    log.debug("csvFilename=", csvFilenameRes.importContacts);
    if (!csvFilename) {
        return;
    }

    if (!await fileExists(csvFilename)) {
        log.info(`Could not find file '${csvFilename}'. Does the file exist?  Is the path correct?`);
        return;
    }

    const csvHeader = await parseCsvHeader(csvFilename, ctx.encoding);
    log.debug("csvHeader=", csvHeader);

    const [contactIdField, contactEmailField, contactFirstNameField, contactLastNameField] =
        await inquireCsvHeaderFields(
            csvHeader.columns,
            [
                {purpose: "Contact ID"},
                {purpose: "Contact email address", allowSkip: true},
                {purpose: "Contact first name", allowSkip: true},
                {purpose: "Contact last name", allowSkip: true}
            ]
        );

    const importContactsParams: ImportContactsParams = {
        filename: csvFilename,
        fields: {
            id: contactIdField,
            email: contactEmailField,
            firstName: contactFirstNameField,
            lastName: contactLastNameField
        }
    };
    const exampleCreateContactParams = rowToCreateContactParams(csvHeader.row, importContactsParams);
    const confirmRes = await inquirer.prompt({
        name: "confirm",
        type: "confirm",
        message: `Imported Contacts will look like ${JSON.stringify(exampleCreateContactParams)}.  Begin importing Contacts?`
    });
    if (confirmRes.confirm) {
        await importContacts(ctx, importContactsParams);
    }
}

export interface ImportContactsParams {
    filename: string;
    fields: {
        id: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
    };
}

function rowToCreateContactParams(row: any, params: ImportContactsParams): lightrail.params.CreateContactParams {
    return {
        id: row[params.fields.id],
        email: params.fields.email ? row[params.fields.email] : undefined,
        firstName: params.fields.firstName ? row[params.fields.firstName] : undefined,
        lastName: params.fields.lastName ? row[params.fields.lastName] : undefined
    };
}

export async function importContacts(ctx: Context, params: ImportContactsParams): Promise<void> {
    log.debug("importContacts", params);
    if (!params.fields.id) {
        throw new Error("Contact fields.id not specified.");
    }

    let contactCreatedCount = 0;
    let contactUpdatedCount = 0;
    let contactSkippedCount = 0;

    await streamCsv(params.filename, ctx.encoding, async (row, lineNumber) => {
        printStatusLine(
            [
                [contactCreatedCount, "Contacts created"],
                [contactUpdatedCount, "Contacts updated"],
                [contactSkippedCount, "Contacts skipped"]
            ]
        );

        const createContactParams = rowToCreateContactParams(row, params);

        try {
            if (ctx.dryRun) {
                log.debug("row=", row);
                if (!createContactParams.id) {
                    log.info("Line", lineNumber, "is missing a Contact ID");
                } else if (createContactParams.email && !/.*@.*/.test(createContactParams.email)) {
                    log.info("Line", lineNumber, "does not have a valid email address");
                } else {
                    log.info("Line", lineNumber, JSON.stringify(createContactParams));
                }
            } else {
                const createRes = await lightrail.contacts.createContact(createContactParams);
                log.debug("createRes=", createRes);
                contactCreatedCount++;
            }
        } catch (err) {
            log.debug("error caught", JSON.stringify(err));
            if ((err as lightrail.LightrailRequestError).messageCode === "ContactIdExists") {
                switch (ctx.alreadyExists) {
                    case "skip":
                        log.debug(err.message, "skipping...");
                        contactSkippedCount++;
                        return;
                    case "update":
                        log.debug(err.message, "updating...");
                        await lightrail.contacts.updateContact(createContactParams.id, {
                            email: createContactParams.email,
                            firstName: createContactParams.firstName,
                            lastName: createContactParams.lastName
                        });
                        contactUpdatedCount++;
                        return;
                    case "warn":
                        log.warn(err.message);
                        return;
                    case "exit":
                        log.error(err.message);
                        process.exit(1);
                }
            }
            throw err;
        }
    });

    if (!ctx.dryRun) {
        printStatusLine(
            [
                [contactCreatedCount, "Contacts created"],
                [contactUpdatedCount, "Contacts updated"],
                [contactSkippedCount, "Contacts skipped"]
            ],
            {
                done: true
            }
        );
    }
}
