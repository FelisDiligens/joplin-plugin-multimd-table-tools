import { Table } from "./table";

export class ParsingError extends Error {
    constructor(msg: string) {
        super(msg);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ParsingError.prototype);
    }
}

export interface TableParser {
    parse(table: string): Table;
}