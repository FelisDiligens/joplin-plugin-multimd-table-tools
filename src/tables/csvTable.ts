import { Table, TableCell, TableColumn, TableRow } from "./table";
import { TableParser } from "./tableParser";
import { TableRenderer } from "./tableRenderer";

/*
 * Due to the nature of CSV tables, some data will be lost when converting MMD (or HTML) to CSV.
 *
 * CSV file specifications and implementation:
 * https://www.rfc-editor.org/rfc/rfc4180
 * http://super-csv.github.io/super-csv/csv_specification.html
 */

export class CSVTableParser implements TableParser {
    public constructor(
        public separator = ",",
        public quote = "\"",
        public assumeFirstLineIsHeader = true) { }

    public parse(table: string): Table {
        /*
            Prepare csv string:
        */
        let csv = table.replace(/\r?\n/g, "\n");
        if (!csv.endsWith("\n"))
            csv += "\n";

        /*
            Parse csv string:
        */
        let parsedTable = new Table();
        let tableRow = parsedTable.addRow();
        tableRow.isHeader = this.assumeFirstLineIsHeader;
        let cellContent: string = "";
        let rowIndex = 0;
        let colIndex = 0;
        let isQuoted = false;
        let lastChar = null;

        for (const char of csv) {
            // Comma or newline:
            if ((char == this.separator || char == "\n") && !isQuoted) {
                // Get column:
                let tableColumn;
                if (rowIndex == 0)
                    tableColumn = parsedTable.addColumn();
                else
                    tableColumn = parsedTable.getColumn(colIndex);

                // Set table cell content:
                let tableCell = new TableCell(parsedTable, tableRow, tableColumn);
                tableCell.setText(cellContent);
                parsedTable.addCell(tableCell);
                //parsedTable.getCellByObjs(tableRow, tableColumn).setText(cellContent);

                cellContent = "";
                colIndex++;

                // If it's a newline:
                if (char == "\n") {
                    // Add a new row to the table:
                    tableRow = parsedTable.addRow();
                    rowIndex++;
                    colIndex = 0;
                }
            } else if (char == this.quote) {
                if (!isQuoted && lastChar == this.quote) {
                    cellContent += this.quote;
                }
                isQuoted = !isQuoted;
            } else {
                cellContent += char;
            }
            lastChar = char;
        }

        // Remove unused row:
        parsedTable.removeRow(tableRow);

        return parsedTable;
    }
}

export enum CSVTableRendererMode {
    OmitSpecialCharacters,
    EscapeWithQuotes,
    AlwaysUseQuotes
}

export class CSVTableRenderer implements TableRenderer {
    public constructor(
        public separator = ",",
        public quote = "\"",
        public lineBreak = "\r\n",
        public mode = CSVTableRendererMode.EscapeWithQuotes) { }

    public render(table: Table): string {
        let specialCharactersRegex = new RegExp(`([${this.separator}${this.quote}]|\r\n|\n)`);
        let specialCharactersRegexGlobal = new RegExp(`([${this.separator}${this.quote}]|\r\n|\n)`, "g");
        let quoteRegex = new RegExp(this.quote, "g");
        let csv: string[] = [];
        for (const row of table.getRows()) {
            let renderedRow: string[] = [];
            for (const cell of table.getCellsInRow(row)) {
                switch (this.mode) {
                    case CSVTableRendererMode.AlwaysUseQuotes:
                        renderedRow.push(`${this.quote}${cell.text.replace(quoteRegex, this.quote.repeat(2))}${this.quote}`);
                        break;
                    case CSVTableRendererMode.EscapeWithQuotes:
                        if (specialCharactersRegex.test(cell.text)) {
                            renderedRow.push(`${this.quote}${cell.text.replace(quoteRegex, this.quote.repeat(2))}${this.quote}`);
                        } else {
                            renderedRow.push(cell.text);
                        }
                        break;
                    case CSVTableRendererMode.OmitSpecialCharacters:
                        renderedRow.push(cell.text.replace(specialCharactersRegexGlobal, ""));
                        break;
                }
            }
            csv.push(renderedRow.join(this.separator));
        }
        return csv.join(this.lineBreak);
    }
}