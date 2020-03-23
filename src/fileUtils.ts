import fs = require("fs");
import path = require("path");

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
        fs.stat(fullPath, (err, stats) => {
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
