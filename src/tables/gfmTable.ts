import { Table, TableCaption, TableCaptionPosition, TableCell, TableCellMerge, TableColumn, TableRow, TextAlignment } from "./table";
import { ParsingError, TableParser } from "./tableParser";
import { TableRenderer } from "./tableRenderer";

/*
    Specification: https://github.github.com/gfm/#tables-extension-
*/

const rowRegex = /^\|(.+)\|$/
const delimiterRowRegex = /^\|(\s*:?\-+:?\s*\|)+$/;

enum ParsingState {
    BeforeTable,
    HeaderRow,
    DelimiterRow,
    DataRows,
    AfterTable
}

export class GitHubFlavoredMarkdownTableParser implements TableParser {
    public parse(table: string): Table {
        let parsedTable = new Table();
        let state = ParsingState.BeforeTable;
        let hasDelimiterRow = false;
        let beforeTable = [];
        let afterTable = [];

        // Now parse line by line:
        for (let line of table.split("\n")) {
            /*
                Determine parsing state and prepare:
            */

            // Check if we are in the table:
            if (state == ParsingState.BeforeTable && line.match(/[^|\\`]\|/g)) {
                state = ParsingState.HeaderRow;
            }

            // The table is broken at the first empty line, or beginning of another block-level structure:
            if (line.trim() === "" || line.trim().startsWith("> ")){
                state = ParsingState.AfterTable;
            }

            // If not inside table:
            if (state == ParsingState.BeforeTable) {
                beforeTable.push(line);
                continue; // Skip the rest
            } else if (state == ParsingState.AfterTable) {
                afterTable.push(line);
                continue; // Skip the rest
            }

            // Format table line:
            line = line.trim();
            if (!line.startsWith("|"))
                line = "|" + line;

            if (!line.endsWith("|") ||
                (line.charAt(line.length - 3) != "\\" && line.endsWith("\\|"))) // Check if last pipe is escaped ('\|')
                line = line + "|";

            if (!line.match(rowRegex))
                throw new ParsingError(`Invalid row: ${line}`);

            // Is delimiter row too early?
            if (state == ParsingState.HeaderRow && line.match(delimiterRowRegex)) {
                throw new ParsingError("Header row missing.");
            }

            /*
                Parse line depending on parsing state:
            */
            
            if (state == ParsingState.HeaderRow || state == ParsingState.DataRows) {
                let tableRow = new TableRow();
                tableRow.isHeader = state == ParsingState.HeaderRow;
                parsedTable.addRow(-1, tableRow);

                // Parse each character:
                let cellContent = "";
                let colIndex = 0;
                let slashEscaped = false;
                let fenceEscaped = false;
                for (let char of line.substring(1, line.length)) {
                    if (!slashEscaped && !fenceEscaped && char == "|") {
                        // Ignore excess cells:
                        if (state == ParsingState.HeaderRow || colIndex < parsedTable.columnCount()) {
                            let tableColumn = parsedTable.getColumn(colIndex);
                            if (!tableColumn)
                                tableColumn = parsedTable.addColumn();
                            let cell = new TableCell(parsedTable, tableRow, tableColumn);
                            parsedTable.addCell(cell);
                            cell.setText(
                                cellContent
                                .trim()
                                .replace(/(<[bB][rR]\s*\/?>)/g, "\n")
                            );
                        }
                        cellContent = "";
                        colIndex++;
                    } else if (!slashEscaped && char == "\\") {
                        slashEscaped = true;
                    } else {
                        if (!slashEscaped && char == "\`")
                            fenceEscaped = !fenceEscaped;
                        if (slashEscaped)
                            cellContent += "\\";
                        cellContent += char;
                        slashEscaped = false;
                    }
                }

                // Insert empty cells if missing:
                for (; colIndex < parsedTable.columnCount(); colIndex++) {
                    let cell = new TableCell(parsedTable, tableRow, parsedTable.getColumn(colIndex));
                    parsedTable.addCell(cell);
                }

                // If the header row has been parsed, parse the delimiter row next:
                if (state == ParsingState.HeaderRow)
                    state = ParsingState.DelimiterRow;
            }
            else if (state == ParsingState.DelimiterRow) {
                if (!line.match(delimiterRowRegex))
                    throw new ParsingError("Invalid delimiter row");

                hasDelimiterRow = true;
                let colIndex = 0;
                let alignment = TextAlignment.default;
                let separator = false;
                for (let char of line.substring(1, line.length)) {
                    if (char == "|") {
                        let tableColumn = parsedTable.getColumn(colIndex);
                        if (!tableColumn)
                            throw new ParsingError("Header row doesn't match the delimiter row in the number of cells.");
                        tableColumn.textAlign = alignment;

                        alignment = TextAlignment.default;
                        separator = false;
                        colIndex++;
                    } else if (char == ":") {
                        if (!separator) {
                            alignment = TextAlignment.left;
                        } else {
                            if (alignment == TextAlignment.left)
                                alignment = TextAlignment.center;
                            else
                                alignment = TextAlignment.right;
                        }
                    } else if (char == "-") {
                        separator = true;
                        if (alignment == TextAlignment.right)
                            throw new ParsingError("Invalid delimiter row (minus sign after colon)");
                    } else if (!char.match(/\s/g)) {
                        throw new ParsingError(`Unexpected character in delimiter row: '${char}'`);
                    }
                }
                
                if (colIndex < parsedTable.columnCount()) {
                    throw new ParsingError("Header row doesn't match the delimiter row in the number of cells.");
                }

                // Once the delimiter row has been parsed, parse the data rows next:
                state = ParsingState.DataRows;
            }
            else {
                throw new ParsingError(`Not implemented ParsingState: ${state}`);
            }
        }

        if (!hasDelimiterRow)
            throw new ParsingError("No delimiter row found.");

        parsedTable.beforeTable = beforeTable.join("\n");
        parsedTable.afterTable = afterTable.join("\n");

        return parsedTable.update();
    }
}

export class GitHubFlavoredMarkdownTableRenderer implements TableRenderer {
    public constructor(
        public prettify = true,
        public renderOutsideTable = true) { }

    public render(table: Table): string {
        const headerRow = table.getHeaderRows()[0];
        const dataRows = table.getNormalRows();
        const columnWidths: number[] = this.prettify ? this.determineColumnWidths(table) : null;

        let result: string[] = [];

        if (this.renderOutsideTable && table.beforeTable.trim() !== "")
            result.push(table.beforeTable);

        // Header row:
        result.push(this.renderRow(table, headerRow, columnWidths));

        // Delimiter row:
        result.push(this.renderDelimiterRow(table, columnWidths));

        // Data rows:
        for (const row of dataRows)
            result.push(this.renderRow(table, row, columnWidths));

        if (this.renderOutsideTable && table.afterTable.trim() !== "")
            result.push(table.afterTable);

        return result.join("\n");
    }

    private renderDelimiterRow(table: Table, columnWidths: number[]): string {
        let result: string[] = [];

        table.getColumns().forEach((col, i) => {
            let width = this.prettify ? columnWidths[i] : null;
            switch (col.textAlign) {
                case TextAlignment.left:
                    result.push(this.prettify ? `:${"-".repeat(width + 1)}` : ":-");
                    break;
                case TextAlignment.center:
                    result.push(this.prettify ? `:${"-".repeat(width)}:` : ":-:");
                    break;
                case TextAlignment.right:
                    result.push(this.prettify ? `${"-".repeat(width + 1)}:` : "-:");
                    break;
                case TextAlignment.default:
                default:
                    result.push(this.prettify ? "-".repeat(width + 2) : "-");
                    break;
            }
        });

        if (this.prettify)
            return `|${result.join("|")}|`;
        else
            return result.join("|");
    }

    private renderRow(table: Table, row: TableRow, columnWidths: number[]): string {
        let result: string[] = [];

        row.getCells().forEach((cell, i) => {
            result.push(this.renderCell(cell, this.prettify ? columnWidths[i] : null));
            if (!this.prettify && i == row.getCells().length - 1 && cell.text.trim() == "")
                result.push("");
        });

        if (this.prettify)
            return `|${result.join("|")}|`;
        else
            return result.join("|");
    }

    private renderCell(cell: TableCell, cellWidth: number = -1): string {
        let text = cell.text.replace(/\r?\n/g, "<br>");

        if (!this.prettify){
            return text;
        }

        switch (cell.getTextAlignment()) {
            case TextAlignment.center:
                return `${" ".repeat(Math.max(0, Math.floor((cellWidth - text.length) / 2)))} ${text} ${" ".repeat(Math.max(0, Math.ceil((cellWidth - text.length) / 2)))}`;
            case TextAlignment.right:
                return `${" ".repeat(Math.max(0, cellWidth - text.length))} ${text} `;
            case TextAlignment.left:
            case TextAlignment.default:
            default:
                return ` ${text} ${" ".repeat(Math.max(0, cellWidth - text.length))}`;
        }
    }
    
    private determineColumnWidth(table: Table, column: TableColumn): number {
        let width = 0;
        for (const cell of table.getCellsInColumn(column))
            width = Math.max(cell.text.replace(/\r?\n/g, "<br>").length, width);
        return width;
    }

    private determineColumnWidths(table: Table): number[] {
        return table.getColumns().map(column => this.determineColumnWidth(table, column));
    }
}