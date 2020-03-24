export interface Context {
    alreadyExists: "skip" | "update" | "warn" | "exit";
    dryRun: boolean;
    encoding: string;
}
