import { Table } from "./table";

export interface TableRenderer {
    render(table: Table): string;
}