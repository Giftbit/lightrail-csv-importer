import lightrail = require("lightrail-client");
import inquirer = require("inquirer");
import log = require("loglevel");
import uuid = require("uuid");
import {Context} from "./Context";
import {fileExists, parseCsvHeader, scanForFiles, streamCsv} from "./utils/fileUtils";
import {inquireCsvHeaderFields} from "./utils/inquirerUtils";
import {printStatusLine} from "./utils/printStatusLine";

export async function importValuesMenu(ctx: Context): Promise<void> {
    const recommendedFiles = await scanForFiles({extension: "csv"});
    log.debug("recommendedFiles=", recommendedFiles);

    const csvFilenameRes = await inquirer.prompt({
        name: "importValues",
        type: "input",
        default: recommendedFiles?.[0],
        message: "Enter the name of the csv file to import:"
    });
    const csvFilename: string = csvFilenameRes.importValues;
    log.debug("csvFilename=", csvFilenameRes.importValues);
    if (!csvFilename) {
        return;
    }

    if (!await fileExists(csvFilename)) {
        log.info(`Could not find file '${csvFilename}'. Does the file exist?  Is the path correct?`);
        return;
    }

    const csvHeader = await parseCsvHeader(csvFilename, ctx.encoding);
    log.debug("csvHeader=", csvHeader);

    const currencyColumnOrEnterChoices = [
        "Use a column from the csv for the currency.",
        "Enter a currency to use for all Values."
    ];
    const currencyColumnOrEnterRes = await inquirer.prompt({
        name: "valueCurrencyColumnOrEnter",
        type: "list",
        message: "Values must be created with a currency.  How should the currency be set?",
        choices: currencyColumnOrEnterChoices
    });
    let fixedCurrency: string = null;
    if (currencyColumnOrEnterRes.valueCurrencyColumnOrEnter === currencyColumnOrEnterChoices[1]) {
        const fixedCurrencyRes = await inquirer.prompt({
            name: "fixedCurrency",
            type: "input",
            message: "Enter the currency to use for all Values:"
        });
        fixedCurrency = fixedCurrencyRes.fixedCurrency;
    }

    let valueCurrencyField: string = null;
    if (!fixedCurrency) {
        valueCurrencyField = (await inquireCsvHeaderFields(
            csvHeader.columns,
            [
                {purpose: "Value currency"}
            ]
        ))[0];
    }

    const [valueIdField, valueCodeField, valueBalanceField, valueContactIdField] =
        await inquireCsvHeaderFields(
            csvHeader.columns,
            [
                {purpose: "Value ID"},
                {purpose: "Value code", allowSkip: true},
                {purpose: "Value balance", allowSkip: true},
                {purpose: "Value attached Contact ID", allowSkip: true}
            ]
        );

    const importValuesParams: ImportValuesParams = {
        filename: csvFilename,
        fixedCurrency: fixedCurrency,
        fields: {
            id: valueIdField,
            balance: valueBalanceField,
            code: valueCodeField,
            currency: valueCurrencyField,
            contactId: valueContactIdField
        }
    };
    const exampleCreateValueParams = rowToCreateValueParams(csvHeader.row, importValuesParams);
    const confirmRes = await inquirer.prompt({
        name: "confirm",
        type: "confirm",
        message: `Imported Values will look like ${JSON.stringify(exampleCreateValueParams)}.  Begin importing Values?`
    });
    if (confirmRes.confirm) {
        await importValues(ctx, importValuesParams);
    }
}

export interface ImportValuesParams {
    filename: string;
    fixedCurrency: string | null;
    fields: {
        id: string;
        balance: string | null;
        code: string | null;
        currency: string | null;
        contactId: string | null;
    };
}

function rowToCreateValueParams(row: any, params: ImportValuesParams): lightrail.params.CreateValueParams {
    return {
        id: row[params.fields.id],
        balance: params.fields.balance ? +row[params.fields.balance] : undefined,
        code: params.fields.code ? row[params.fields.code] : undefined,
        currency: params.fixedCurrency ? params.fixedCurrency : row[params.fields.currency],
        contactId: params.fields.contactId ? row[params.fields.contactId] : undefined
    };
}

export async function importValues(ctx: Context, params: ImportValuesParams): Promise<void> {
    log.debug("importValues", params);
    if (!params.fields.id) {
        throw new Error("Value fields.id not specified.");
    }
    if (!!params.fixedCurrency === !!params.fields.currency) {
        throw new Error("Exactly one of fixedCurrency or fields.currency must be specified.");
    }

    let valueCreatedCount = 0;
    let valueUpdatedCount = 0;
    let valueSkippedCount = 0;

    await streamCsv(params.filename, ctx.encoding, async (row, lineNumber) => {
        printStatusLine(
            [
                [valueCreatedCount, "Values created"],
                [valueUpdatedCount, "Values updated"],
                [valueSkippedCount, "Values skipped"]
            ]
        );

        const createValueParams = rowToCreateValueParams(row, params);

        try {
            if (ctx.dryRun) {
                log.debug("row=", row);
                if (!createValueParams.id) {
                    log.info("Line", lineNumber, "is missing a Value ID");
                } else if (!createValueParams) {
                    log.info("Line", lineNumber, "does not have a valid currency");
                } else if (params.fields.balance && isNaN(createValueParams.balance)) {
                    log.info("Line", lineNumber, "does not have a valid balance");
                } else {
                    log.info("Line", lineNumber, JSON.stringify(createValueParams));
                }
            } else {
                const createRes = await lightrail.values.createValue(createValueParams);
                log.debug("createRes=", createRes);
                valueCreatedCount++;
            }
        } catch (err) {
            log.debug("error caught", JSON.stringify(err));
            if ((err as lightrail.LightrailRequestError).messageCode === "ValueIdExists") {
                switch (ctx.alreadyExists) {
                    case "skip":
                        log.debug(err.message, "skipping...");
                        valueSkippedCount++;
                        return;
                    case "update":
                        log.debug(err.message, "updating...");
                        await updateValue(createValueParams);
                        valueUpdatedCount++;
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
                [valueCreatedCount, "Values created"],
                [valueUpdatedCount, "Values updated"],
                [valueSkippedCount, "Values skipped"]
            ],
            {
                done: true
            }
        );
    }
}

async function updateValue(createValueParams: lightrail.params.CreateValueParams): Promise<void> {
    const value = await lightrail.values.getValue(createValueParams.id, {showCode: true});
    if (value.body.currency !== createValueParams.currency) {
        throw new Error(`Value with ID ${value.body.id} can not be updated to match the csv because the csv has currency ${createValueParams.currency} and the Value has currency ${value.body.currency} and the Value's currency can never be changed.`);
    }
    if (createValueParams.balance != null && value.body.balance !== createValueParams.balance) {
        const balanceChange = createValueParams.balance - value.body.balance;
        if (balanceChange > 0) {
            const txParams: lightrail.params.CreditParams = {
                id: uuid.v4(),
                amount: balanceChange,
                currency: value.body.currency,
                destination: {
                    rail: "lightrail",
                    valueId: createValueParams.id
                }
            };
            log.debug("txParams=", txParams);
            const txRes = await lightrail.transactions.credit(txParams);
            log.debug("txRes=", txRes);
        } else {
            const txParams: lightrail.params.DebitParams = {
                id: uuid.v4(),
                amount: -balanceChange,
                currency: value.body.currency,
                source: {
                    rail: "lightrail",
                    valueId: createValueParams.id
                }
            };
            log.debug("txParams=", txParams);
            const txRes = await lightrail.transactions.debit(txParams);
            log.debug("txRes=", txRes);
        }
    }
    if (!value.body.contactId) {
        const attachParams = {valueId: createValueParams.id};
        log.debug("attachParams=", attachParams);
        const attachResp = await lightrail.contacts.attachContactToValue(createValueParams.contactId, attachParams);
        log.debug("attachResp=", attachResp);
    }
    if (value.body.code !== createValueParams.code) {
        const changeCodeParams = {code: createValueParams.code};
        log.debug("changeCodeParams=", changeCodeParams);
        const changeCodeResp = await lightrail.values.changeValuesCode(value.body, changeCodeParams);
        log.debug("changeCodeResp=", changeCodeResp);
    }
}
