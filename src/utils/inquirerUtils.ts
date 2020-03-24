import inquirer = require("inquirer");

export interface InquireCsvHeaderField {
    purpose: string;
    allowSkip?: boolean;
}

export async function inquireCsvHeaderFields(headers: string[], fields: InquireCsvHeaderField[]): Promise<string[]> {
    const skipFieldChoice = "(skip)";
    const res = await inquirer.prompt(
        fields.map(field => {
            return {
                name: field.purpose,
                type: "list",
                message: `Select the column containing the ${field.purpose}`,
                choices: [...headers, ...(field.allowSkip ? [skipFieldChoice] : [])],
                askAnswered: true
            }
        })
    );
    return fields.map(field => res[field.purpose] === skipFieldChoice ? null : res[field.purpose] as string);
}
