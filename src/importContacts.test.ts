import chai = require("chai");
import lightrail = require("lightrail-client");
import path = require("path");
import sinon = require("sinon");
import {importContacts} from "./importContacts";

describe("importContacts", () => {

    let sandbox: sinon.SinonSandbox;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        sandbox = null;
    });

    it("can import a csv", async () => {
        const createContactParams: lightrail.params.CreateContactParams[] = [];
        sandbox.replace(lightrail.contacts, "createContact", params => {
            createContactParams.push(params);
            const contact = createContactParamsToContact(params);
            return Promise.resolve({
                status: 201,
                body: contact,
                text: JSON.stringify(contact)
            });
        });

        await importContacts(
            {
                alreadyExists: "skip",
                dryRun: false,
                encoding: "utf8"
            },
            {
                fileame: path.join(__dirname, "..", "testData", "contacts-ascii.csv"),
                fields: {
                    id: "System ID",
                    email: "Email",
                    firstName: "First Name",
                    lastName: "Last Name"
                }
            }
        );

        chai.assert.lengthOf(createContactParams, 50);

        chai.assert.equal(createContactParams[0].id, "1");
        chai.assert.equal(createContactParams[0].email, "jbutt@gmail.com");
        chai.assert.equal(createContactParams[0].firstName, "James");
        chai.assert.equal(createContactParams[0].lastName, "Butt");

        chai.assert.equal(createContactParams[49].id, "50");
        chai.assert.equal(createContactParams[49].email, "bmalet@yahoo.com");
        chai.assert.equal(createContactParams[49].firstName, "Blair");
        chai.assert.equal(createContactParams[49].lastName, "Malet");
    });

    it("can import a csv with utf8 characters", async () => {
        const createContactParams: lightrail.params.CreateContactParams[] = [];
        sandbox.replace(lightrail.contacts, "createContact", params => {
            createContactParams.push(params);
            const contact = createContactParamsToContact(params);
            return Promise.resolve({
                status: 201,
                body: contact,
                text: JSON.stringify(contact)
            });
        });

        await importContacts(
            {
                alreadyExists: "skip",
                dryRun: false,
                encoding: "utf8"
            },
            {
                fileame: path.join(__dirname, "..", "testData", "contacts-international.csv"),
                fields: {
                    id: "GUID",
                    email: "Email",
                    firstName: "First Name",
                    lastName: "Last Name"
                }
            }
        );

        chai.assert.lengthOf(createContactParams, 4);

        chai.assert.equal(createContactParams[0].id, "4a4377f0-466f-404e-a6b0-6061e7e6670d");
        chai.assert.equal(createContactParams[0].email, "zyehuri@yahoo.jp");
        chai.assert.equal(createContactParams[0].firstName, "じぇ");
        chai.assert.equal(createContactParams[0].lastName, "ふり");
    });

    it("does not make changes when dryRun=true", async () => {
        const createContactParams: lightrail.params.CreateContactParams[] = [];
        sandbox.replace(lightrail.contacts, "createContact", params => {
            createContactParams.push(params);
            const contact = createContactParamsToContact(params);
            return Promise.resolve({
                status: 201,
                body: contact,
                text: JSON.stringify(contact)
            });
        });

        await importContacts(
            {
                alreadyExists: "skip",
                dryRun: true,
                encoding: "utf8"
            },
            {
                fileame: path.join(__dirname, "..", "testData", "contacts-ascii.csv"),
                fields: {
                    id: "System ID",
                    email: "Email",
                    firstName: "First Name",
                    lastName: "Last Name"
                }
            }
        );

        chai.assert.lengthOf(createContactParams, 0);
    });
});

function createContactParamsToContact(params: lightrail.params.CreateContactParams): lightrail.model.Contact {
    // Could do more here if the script ever looks at the contents.
    return params as any;
}
