import fs = require("fs");
import log = require("loglevel");
import path = require("path");
import Papa = require("papaparse");

export function scanForFiles(params: {dir?: string, extension?: string} = {}): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const scanDir = params.dir ?? process.cwd();
        fs.readdir(scanDir, (err, files) => {
            if (err) {
                reject(err);
            } else {
                if (params.extension) {
                    const extension = "." + params.extension;
                    files = files.filter(file => file.endsWith(extension));
                }
                files = files.map(file => path.join(scanDir, file));
                resolve(files);
            }
        });
    });
}

export function fileExists(fullPath: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.stat(fullPath, (err) => {
            if (!err) {
                resolve(true);
            } else if (err.code === "ENOENT") {
                resolve(false);
            } else {
                reject(err);
            }
        })
    });
}

export function parseCsvHeader(fullPath: string, encoding: string): Promise<{columns: string[], row: any}> {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(fullPath, {encoding});
        Papa.parse(fileStream, {
            header: true,
            preview: 1,
            skipEmptyLines: "greedy",
            encoding,
            dynamicTyping: false,
            error: err => {
                reject(err);
            },
            complete: results => {
                fileStream.destroy();
                if (results.errors?.length) {
                    log.debug("parseCsvHeaders errors=", results.errors);
                    reject(new Error(`Unable to parse headers from the CSV file ${fullPath}: ${results.errors[0].message}`));
                    return;
                }
                resolve({
                    columns: results.meta.fields,
                    row: results.data[0]
                });
            }
        })
    });
}

export function streamCsv(fullPath: string, encoding: string, callback: (row: any, lineNumber: number) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(fullPath, {encoding});
        let lineNumber = 2; // 1-indexed, line 1 is the header, line 2 is the first data row
        Papa.parse(fileStream, {
            header: true,
            skipEmptyLines: "greedy",
            encoding,
            dynamicTyping: false,
            error: err => {
                reject(err);
            },
            step: (results, parser) => {
                parser.pause();
                try {
                    const callbackRes = callback(results.data, lineNumber++);
                    if (callbackRes.then) {
                        callbackRes.then(() => parser.resume());
                    } else {
                        parser.resume();
                    }
                } catch (err) {
                    parser.abort();
                    reject(err);
                }
            },
            complete: () => {
                resolve();
            }
        });
    });
}
