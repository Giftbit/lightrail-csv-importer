import chai = require("chai");
import lightrail = require("lightrail-client");
import path = require("path");
import sinon = require("sinon");
import {importContacts} from "./importContacts";
import {importValues} from "./importValues";

describe("importValues", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        sandbox = null;
    });

    it("imports a csv", async () => {
        const createValueParams: lightrail.params.CreateValueParams[] = [];
        sandbox.replace(lightrail.values, "createValue", params => {
            createValueParams.push(params);
            const value = createValueParamsToValue(params);
            return Promise.resolve({
                status: 201,
                body: value,
                text: JSON.stringify(value)
            });
        });

        await importValues(
            {
                alreadyExists: "skip",
                dryRun: false,
                encoding: "utf8"
            },
            {
                filename: path.join(__dirname, "..", "testData", "values.csv"),
                fixedCurrency: null,
                fields: {
                    id: "Gift Card ID",
                    code: "Code",
                    balance: "Balance",
                    currency: "Currency",
                    contactId: "Contact"
                }
            }
        );

        chai.assert.lengthOf(createValueParams, 10);

        chai.assert.equal(createValueParams[0].id, "527fde6f-f47c-422d-bb07-dfb3ef3ba89f");
        chai.assert.equal(createValueParams[0].code, "ABCD1234");
        chai.assert.equal(createValueParams[0].balance, 5000);
        chai.assert.equal(createValueParams[0].currency, "USD");

        chai.assert.equal(createValueParams[4].id, "cda0eedb-c47b-44a2-962b-1e0bbc62db38");
        chai.assert.equal(createValueParams[4].code, "EFGH5678");
        chai.assert.equal(createValueParams[4].balance, 2500);
        chai.assert.equal(createValueParams[4].currency, "CAD");
    });

    it("can fix the currency rather than taking it from a column", async () => {
        const createValueParams: lightrail.params.CreateValueParams[] = [];
        sandbox.replace(lightrail.values, "createValue", params => {
            createValueParams.push(params);
            const value = createValueParamsToValue(params);
            return Promise.resolve({
                status: 201,
                body: value,
                text: JSON.stringify(value)
            });
        });

        await importValues(
            {
                alreadyExists: "skip",
                dryRun: false,
                encoding: "utf8"
            },
            {
                filename: path.join(__dirname, "..", "testData", "values.csv"),
                fixedCurrency: "PNTS",
                fields: {
                    id: "Gift Card ID",
                    code: null,
                    balance: "Balance",
                    currency: null,
                    contactId: null
                }
            }
        );

        chai.assert.lengthOf(createValueParams, 10);

        chai.assert.equal(createValueParams[0].id, "527fde6f-f47c-422d-bb07-dfb3ef3ba89f");
        chai.assert.equal(createValueParams[0].code, null);
        chai.assert.equal(createValueParams[0].balance, 5000);
        chai.assert.equal(createValueParams[0].currency, "PNTS");
    });

    it("does not make a change when dryRun=true", async () => {
        const createValueParams: lightrail.params.CreateValueParams[] = [];
        sandbox.replace(lightrail.values, "createValue", params => {
            createValueParams.push(params);
            const value = createValueParamsToValue(params);
            return Promise.resolve({
                status: 201,
                body: value,
                text: JSON.stringify(value)
            });
        });

        await importValues(
            {
                alreadyExists: "skip",
                dryRun: true,
                encoding: "utf8"
            },
            {
                filename: path.join(__dirname, "..", "testData", "values.csv"),
                fixedCurrency: null,
                fields: {
                    id: "Gift Card ID",
                    code: "Code",
                    balance: "Balance",
                    currency: "Currency",
                    contactId: "Contact"
                }
            }
        );

        chai.assert.lengthOf(createValueParams, 0);
    });
});

function createValueParamsToValue(params: lightrail.params.CreateValueParams): lightrail.model.Value {
    // Could do more here if the script ever looks at the contents.
    return params as any;
}
