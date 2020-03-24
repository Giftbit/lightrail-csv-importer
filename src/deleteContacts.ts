import lightrail = require("lightrail-client");
import inquirer = require("inquirer");
import log = require("loglevel");
import {Context} from "./Context";

export async function deleteContactsMenu(ctx: Context): Promise<void> {
    const confirmRes = await inquirer.prompt([{
        name: "confirm",
        type: "confirm",
        message: `Delete all Contacts not used in a Transaction?`,
        askAnswered: true
    }]);
    if (confirmRes.confirm) {
        await deleteContacts(ctx);
    }
}

export async function deleteContacts(ctx: Context): Promise<void> {
    if (ctx.dryRun) {
        log.info("No Contacts are deleted in dry run.");
        return;
    }

    let contactDeletedCount = 0;
    let contactSkippedCount = 0;

    let contactsResponse = await lightrail.contacts.listContacts();
    while (contactsResponse) {
        for (const contact of contactsResponse.body) {
            try {
                log.debug("delete Contact", contact.id);
                const deleteContactResponse = await lightrail.contacts.deleteContact(contact);
                contactDeletedCount++;
                log.debug("deleteContactResponse=", deleteContactResponse);
            } catch (err) {
                if ((err as lightrail.LightrailRequestError).messageCode === "ContactInUse") {
                    log.debug(err.messageCode);
                    contactSkippedCount++;
                } else {
                    throw err;
                }
            }
        }

        if (contactsResponse.links["next"]) {
            contactsResponse = lightrail.request("GET", contactsResponse.links["next"].url);
        } else {
            contactsResponse = null;
        }

        log.info(contactDeletedCount, "Contacts deleted");
        log.info(contactSkippedCount, "Contacts skipped");
    }
}
