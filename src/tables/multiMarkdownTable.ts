import { Table, TableCaption, TableCaptionPosition, TableCell, TableCellMerge, TableColumn, TableRow, TextAlignment } from "./table";
import { ParsingError, TableParser } from "./tableParser";
import { TableRenderer } from "./tableRenderer";

/*
    Specification: https://fletcher.github.io/MultiMarkdown-6/syntax/tables.html
*/

const rowRegex = /^\|(.+)\|$/
const separatorRegex = /^\|([\s\.]*:?[\-=\.]+:?\+?[\s\.]*\|)+$/;
const captionRegex = /^(\[.+\]){1,2}$/;

enum ParsingState {
    BeforeTable,
    TopCaption,
    Header,
    Separator,
    Row,
    BottomCaption,
    AfterTable
}

export class MultiMarkdownTableParser implements TableParser {
    public parse(table: string): Table {
        let parsedTable = new Table();
        let state = ParsingState.BeforeTable;
        let startNewSection = false;
        let hasSeparator = false;
        let beforeTable = [];
        let afterTable = [];

        // Parse line by line:
        for (let line of table.split("\n")) {
            /*
                Determine parsing state and prepare:
            */

            // Check if we are in the table:
            if (state == ParsingState.BeforeTable && (line.match(/[^|\\`]\|/g) || line.trim().match(captionRegex))) {
                if (line.trim().match(captionRegex))
                    state = ParsingState.TopCaption;
                else
                    state = ParsingState.Header;
            }

            // Check if we are no longer in the table:
            if (state != ParsingState.BeforeTable && state != ParsingState.AfterTable && !( // If not:
                (line.replace(/\`[^\`]*\`/g, "").match(/[^|\\`]\|/g) && !line.startsWith("[") && !line.endsWith("]")) || // row
                (line.trim().match(captionRegex) && (state == ParsingState.TopCaption || parsedTable.caption == null)) || // valid caption
                (line.trim() === "" && !startNewSection && state != ParsingState.Separator))) { // single empty line allowed (except after separator)
                state = ParsingState.AfterTable;
                if (startNewSection)
                    afterTable.push("");
            }

            // If not inside table:
            if (state == ParsingState.BeforeTable) {
                beforeTable.push(line);
                continue; // Skip the rest
            } else if (state == ParsingState.AfterTable) {
                afterTable.push(line);
                continue; // Skip the rest
            }

            // Is empty line?
            if (line === "") {
                if (startNewSection)
                    throw new ParsingError("Invalid table: No more than one empty line allowed.");

                if (state == ParsingState.Row)
                    startNewSection = true;

                continue;
            }

            // Format table line:
            line = line.trim();
            if (!line.match(captionRegex)) {
                if (!line.startsWith("|"))
                    line = "|" + line;

                if (!line.endsWith("|") ||
                    (line.charAt(line.length - 3) != "\\" && line.endsWith("\\|"))) // Check if last pipe is escaped ('\|')
                    line = line + "|";

                if (!line.match(rowRegex))
                    throw new ParsingError(`Invalid row: ${line}`);
            }

            // Is separator?
            if ((state == ParsingState.TopCaption || state == ParsingState.Header) && line.match(separatorRegex)) {
                state = ParsingState.Separator;
            }
            // Is header?
            else if (state == ParsingState.TopCaption && line.match(rowRegex)) {
                state = ParsingState.Header;
            }
            // Is bottom caption?
            else if ((state == ParsingState.Separator || state == ParsingState.Row) && line.match(captionRegex)) {
                state = ParsingState.BottomCaption;
            }
            // If separator has been parsed last iteration:
            else if (state == ParsingState.Separator) {
                state = ParsingState.Row;
            }

            /*
                Parse line depending on parsing state:
            */
            
            if (state == ParsingState.Header || state == ParsingState.Row) {
                let tableRow = new TableRow();
                if (state == ParsingState.Header) {
                    tableRow.isHeader = true;
                } else {
                    tableRow.startsNewSection = startNewSection;
                    startNewSection = false;
                }
                parsedTable.addRow(-1, tableRow);

                // Parse each character:
                let cellContent = "";
                let colIndex = 0;
                let slashEscaped = false;
                let fenceEscaped = false;
                for (let char of line.substring(1, line.length)) {
                    if (!slashEscaped && !fenceEscaped && char == "|") {
                        let tableColumn = parsedTable.getColumn(colIndex);
                        if (!tableColumn)
                            tableColumn = parsedTable.addColumn();
                        let cell = new TableCell(parsedTable, tableRow, tableColumn);
                        parsedTable.addCell(cell);

                        if (cellContent.trim() == "^^") {
                            cell.merged = TableCellMerge.above;
                        } else if (cellContent === "") {
                            cell.merged = TableCellMerge.left;
                        } else {
                            cell.setText(
                                cellContent
                                .trim()
                                .replace(/(<\s*[bB][rR]\s*\/?>)/g, "\n")
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
            }
            else if (state == ParsingState.Separator) {
                hasSeparator = true;
                let colIndex = 0;
                let alignment = TextAlignment.default;
                let wrappable = false;
                let separator = false;
                for (let char of line.substring(1, line.length)) {
                    if (char == "|") {
                        let tableColumn = parsedTable.getColumn(colIndex);
                        if (!tableColumn)
                            tableColumn = parsedTable.addColumn();
                        tableColumn.textAlign = alignment;
                        tableColumn.wrappable = wrappable;

                        alignment = TextAlignment.default;
                        separator = false;
                        wrappable = false;
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
                    } else if (char == "-" || char == "=") {
                        separator = true;
                        if (alignment == TextAlignment.right || wrappable)
                            throw new ParsingError("Invalid separator");
                    } else if (char == "+") { // "If the separator line ends with +, then cells in that column will be wrapped when exporting to LaTeX if they are long enough."
                        wrappable = true;
                    }
                    // char == "." => idk ???
                }
            }
            else if (state == ParsingState.TopCaption || state == ParsingState.BottomCaption) {
                // "If you have a caption before and after the table, only the first match will be used."
                if (parsedTable.caption != null)
                    continue;

                let caption = new TableCaption();
                caption.position = state == ParsingState.TopCaption ? TableCaptionPosition.top : TableCaptionPosition.bottom;

                let split = line.split(/[\[\]]+/).filter(s => s.trim() !== "");
                caption.text = split[0]
                               .trim()
                               .replace(/(<\s*[bB][rR]\s*\/?>)/g, "\n");
                if (split.length > 1)
                    caption.label = split[1]
                                    .trim()
                                    .replace(/\s+/g, "-");

                parsedTable.caption = caption;
            }
            else {
                throw new ParsingError(`Not implemented ParsingState: ${state}`);
            }
        }

        if (!hasSeparator)
            throw new ParsingError("No separator row found.");

        parsedTable.beforeTable = beforeTable.join("\n");
        parsedTable.afterTable = afterTable.join("\n");

        return parsedTable.update();
    }
}

export class MinifiedMultiMarkdownTableRenderer implements TableRenderer {
    public constructor(
        public renderOutsideTable = true) { }

    public render(table: Table): string {
        const headerRows = table.getHeaderRows();
        const normalRows = table.getNormalRows();

        let result: string[] = [];

        if (this.renderOutsideTable && table.beforeTable.trim() !== "")
            result.push(table.beforeTable);
            
        // Caption (if position is top):
        if (table.caption && table.caption.position == TableCaptionPosition.top) {
            result.push(this.renderCaption(table.caption));
        }

        // Header:
        if (headerRows.length > 0)
            for (const row of headerRows)
                result.push(this.renderRow(table, row));

        // Separator:
        result.push(this.renderSeparator(table));

        // Rows:
        for (const row of normalRows) {
            if (row.startsNewSection)
                result.push("");
            result.push(this.renderRow(table, row));
        }
            
        // Caption (if position is bottom):
        if (table.caption && table.caption.position == TableCaptionPosition.bottom) {
            result.push(this.renderCaption(table.caption));
        }

        if (this.renderOutsideTable && table.afterTable.trim() !== "")
            result.push(table.afterTable);

        return result.join("\n");
    }

    private renderCaption(caption: TableCaption): string {
        let result: string[] = [];
        if (caption.text.length > 0) {
            result.push(`[${caption.text}]`);
            if (caption.label.length > 0) {
                result.push(`[${caption.label}]`);
            }
        }
        return result.join("");
    }

    private renderSeparator(table: Table): string {
        let result: string[] = [];

        table.getColumns().forEach((col, i) => {
            let chunk;
            switch (col.textAlign) {
                case TextAlignment.left:
                    chunk = ":-";
                    break;
                case TextAlignment.center:
                    chunk = ":-:";
                    break;
                case TextAlignment.right:
                    chunk = "-:";
                    break;
                case TextAlignment.default:
                default:
                    chunk = "-";
                    break;
            }
            result.push(chunk + (col.wrappable ? "+" : ""));
        });

        return result.join("|");
    }

    private renderRow(table: Table, row: TableRow): string {
        let result: string = "";
        let cells = table.getCellsInRow(row);

        cells.forEach((cell, i) => {
            if (cell.merged == TableCellMerge.left) {
                result += "|";
            } else if (cell.merged == TableCellMerge.above) {
                result += "^^|";
            } else if (i == 0 && cell.text.trim() === "") {
                result += "| |";
            } else if (cell.text.trim() === "") {
                result += " |";
            } else {
                let text = cell.text.trim().replace(/\r?\n/g, "<br>");
                result += `${text}|`;
            }

            // Last cell:
            if (i == cells.length - 1 && cell.text.trim() != "" && cell.merged != TableCellMerge.left)
                result = result.substring(0, result.length - 1); // Omit last '|' if possible
        });

        return result;
    }
}

export class PrettyMultiMarkdownTableRenderer implements TableRenderer {
    public constructor(
        public renderOutsideTable = true) { }

    public render(table: Table): string {
        const headerRows = table.getHeaderRows();
        const normalRows = table.getNormalRows();
        const columnWidths = this.determineColumnWidths(table);

        let result: string[] = [];

        if (this.renderOutsideTable && table.beforeTable.trim() !== "")
            result.push(table.beforeTable);
            
        // Caption (if position is top):
        if (table.caption && table.caption.position == TableCaptionPosition.top) {
            result.push(this.renderCaption(table.caption));
        }

        // Header:
        if (headerRows.length > 0)
            for (const row of headerRows)
                result.push(this.renderRow(table, row, columnWidths));

        // Separator:
        result.push(this.renderSeparator(table, columnWidths));

        // Rows:
        for (const row of normalRows) {
            if (row.startsNewSection)
                result.push("");
            result.push(this.renderRow(table, row, columnWidths));
        }
            
        // Caption (if position is bottom):
        if (table.caption && table.caption.position == TableCaptionPosition.bottom) {
            result.push(this.renderCaption(table.caption));
        }
        
        if (this.renderOutsideTable && table.afterTable.trim() !== "")
            result.push(table.afterTable);

        return result.join("\n");
    }

    private renderCaption(caption: TableCaption): string {
        let result: string[] = [];
        if (caption.text.length > 0) {
            result.push(`[${caption.text}]`);
            if (caption.label.length > 0) {
                result.push(`[${caption.getLabel()}]`);
            }
        }
        return result.join("");
    }

    private renderSeparator(table: Table, columnWidths: number[]): string {
        let result: string[] = [];

        table.getColumns().forEach((col, i) => {
            let width = columnWidths[i];
            switch (col.textAlign) {
                case TextAlignment.left:
                    if (col.wrappable)
                        result.push(`:${"-".repeat(width)}+`);
                    else
                        result.push(`:${"-".repeat(width + 1)}`);
                    break;
                case TextAlignment.center:
                    if (col.wrappable)
                        result.push(`:${"-".repeat(width - 1)}:+`);
                    else
                        result.push(`:${"-".repeat(width)}:`);
                    break;
                case TextAlignment.right:
                    if (col.wrappable)
                        result.push(`${"-".repeat(width)}:+`);
                    else
                        result.push(`${"-".repeat(width + 1)}:`);
                    break;
                case TextAlignment.default:
                default:
                    if (col.wrappable)
                        result.push(`${"-".repeat(width + 1)}+`);
                    else
                        result.push("-".repeat(width + 2));
                    break;
            }
        });

        return `|${result.join("|")}|`;
    }

    private renderRow(table: Table, row: TableRow, columnWidths: number[]): string {
        let result: string[] = [];

        table.getCellsInRow(row).forEach((cell, i) => {
            let colspan = cell.getColspan();
            let cellWidth = columnWidths[i];
            if (colspan > 1) {
                for (let col = i + 1; col < i + colspan; col++)
                    cellWidth += columnWidths[col];
                cellWidth += colspan * 2 - 2; // + Math.floor((colspan - 1) / 2);
            }
            result.push(this.renderCell(cell, colspan, cellWidth));
        });

        return `|${result.join("|")}|`;
    }

    private renderCell(cell: TableCell, colspan: number = 1, cellWidth: number = -1): string {
        if (cell.merged == TableCellMerge.left)
            return "";

        let text = cell.merged == TableCellMerge.above ? "^^" : cell.text.replace(/\r?\n/g, "<br>");

        switch (cell.getTextAlignment()) {
            case TextAlignment.center:
                return `${" ".repeat(Math.max(0, Math.floor((cellWidth - text.length + colspan - 1) / 2)))} ${text} ${" ".repeat(Math.max(0, Math.ceil((cellWidth - text.length - colspan + 1) / 2)))}`;
            case TextAlignment.right:
                return `${" ".repeat(Math.max(0, cellWidth - text.length))} ${text} `;
            case TextAlignment.left:
            case TextAlignment.default:
            default:
                return ` ${text} ${" ".repeat(Math.max(0, cellWidth - text.length))}`;
        }
    }

    private determineColumnWidths(table: Table): number[] {
        let columnWidths: number[] = Array.from({length: table.columnCount()}, () => 0);

        for (let colIndex = table.columnCount() - 1; colIndex >= 0; colIndex--) {
            const column = table.getColumn(colIndex);
            let width = 0;
            for (const cell of table.getCellsInColumn(column)) {
                let colspan = cell.getColspan();
                let textWidth = cell.merged == TableCellMerge.above ? 2 : cell.text.replace(/\r?\n/g, "<br>").length;
                if (colspan == 1) {
                    width = Math.max(textWidth, width);
                } else {
                    let leftoverWidth = columnWidths.slice(colIndex + 1, colIndex + colspan).reduce((pv, cv) => pv + cv);
                    // let combinedWidth = width + leftoverWidth;
                    width = Math.max(textWidth - leftoverWidth, width);
                }
            }
            columnWidths.splice(colIndex, 1, width);
        }

        return columnWidths;
    }
}