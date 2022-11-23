import { Editor, Position } from 'codemirror';

const separatorRegex = /^\|?([\s\.]*:?[\-=\.]+[:\+]?[\s\.]*\|?)+\|?$/;
const captionRegex = /^(\[.+\]){1,2}$/;

interface Range {
    from: Position,
    to: Position
}

export function createPosition(line: number, ch: number): Position {
    return {line, ch};
}

export function createRange(from: Position, to: Position): Range {
    return {
        from,
        to
    }
}

/** If paired with "await", it will block the thread for the duration of the given milliseconds. */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function determineColumnIndex(line: string, ch: number): number {
    let row = line.substring(0, ch).trim();
    if (row.startsWith("|"))
        row = row.substring(1);
    let colIndex = 0;
    let escape = false;
    for (const ch of row) {
        if (ch == "|" && !escape) {
            colIndex++;
        } else if (ch == "\\") {
            escape = !escape;
        }
    }
    return colIndex;
}

export function getColumnRanges(line: string, cursor: Position) {
    if (!line.trim().endsWith("|"))
        line += "|";

    let ranges: Range[] = [];
    let cursorColIndex: number;
    
    let rangeStart = line.trim().startsWith("|") ? line.indexOf("|") : 0;
    let colIndex = 0;
    let escape = false;
    for (let ch = line.startsWith("|") ? 1 : 0; ch < line.length; ch++) {
        if (line.charAt(ch) == "|" && !escape) {
            if (rangeStart <= cursor.ch && cursor.ch <= ch) {
                cursorColIndex = colIndex;
            }
            ranges.push(createRange(
                createPosition(cursor.line, rangeStart),
                createPosition(cursor.line, ch)
            ));
            rangeStart = ch + 1;
            colIndex++;
        } else if (line.charAt(ch) == "\\") {
            escape = !escape;
        }
    }

    return {
        ranges,
        firstRange: ranges[0],
        previousRange: ranges[cursorColIndex - 1],
        currentRange: ranges[cursorColIndex],
        nextRange: ranges[cursorColIndex + 1],
        lastRange: ranges[ranges.length - 1],
        colIndex: cursorColIndex
    }
}

/**
 * Searches the entire document for tables and returns a list of ranges.
 * @param cm The CodeMirror editor
 * @param allowEmptyLine Whether it should ignore a single empty line (MultiMarkdown).
 * @returns A list of every table's range within the document.
 */
export function getRangesOfAllTables(cm: Editor, allowEmptyLine: boolean): Range[] {
    let ranges: Range[] = [];
    const doc = cm.getDoc();
    let cursor = { } as Position;

    let tableStartLine = -1;
    let tableEndLine = -1;
    let insideTable = false;
    let hasSeparator = false;
    let rememberEmptyLine = false;
    for (cursor.line = doc.firstLine(); cursor.line <= doc.lastLine(); cursor.line++) {
        let line = cm.getLine(cursor.line).trim();

        // Does line match criteria?
        if (line.includes("|") || line.match(captionRegex)) {
            if (!insideTable) {
                tableStartLine = cursor.line;
                insideTable = true;
            }

            tableEndLine = cursor.line;

            if (line.match(separatorRegex))
                hasSeparator = true;
            
        // Ignore a single empty line:
        } else if (insideTable && line.trim() === "" && allowEmptyLine && !rememberEmptyLine) {
            rememberEmptyLine = true;

        // Stop once a line doesn't match criteria:
        } else if (insideTable) {
            // If the table has a separator and we have at least two lines, it's probably a valid table:
            if (hasSeparator && tableEndLine - tableStartLine >= 1) {
                ranges.push(createRange(
                    createPosition(tableStartLine, 0),
                    createPosition(tableEndLine, cm.getLine(tableEndLine).length)
                ));
            }

            // Reset variables:
            insideTable = false;
            rememberEmptyLine = false;
            hasSeparator = false;
        }
    }

    // If table is at the end and hasn't been added:
    if (insideTable && hasSeparator && tableEndLine - tableStartLine >= 1) {
        ranges.push(createRange(
            createPosition(tableStartLine, 0),
            createPosition(tableEndLine, cm.getLine(tableEndLine).length)
        ));
    }

    return ranges;
}

/**
 * Returns whether the cursor sits inside a table.
 * @remarks It currently uses getRangeOfTable, which might not be as efficent.
 * @param cm The CodeMirror editor
 * @param allowEmptyLine Whether it should ignore a single empty line (MultiMarkdown).
 */
export function isCursorInTable(cm: Editor, allowEmptyLine: boolean): boolean {
    return getRangeOfTable(cm, allowEmptyLine) !== null;
}

/**
 * Returns the range (line numbers and character numbers) of the table and the selected row/column at the cursor. If there is no table at the cursor, it returns null.
 * @param cm The CodeMirror editor
 * @param allowEmptyLine Whether it should ignore a single empty line (MultiMarkdown).
 * @returns \{ range, row, column \} or null
 */
export function getRangeOfTable(cm: Editor, allowEmptyLine: boolean): { range: Range, row: number, column: number} {
    const cursor = cm.getCursor();
    let hasSeparator = false;

    // Determine startLine:
    let rowIndex = 0;
    let startLine = cursor.line;
    let rememberEmptyLine = false;
    while (startLine >= 0) {
        let line = cm.getLine(startLine).trim();

        if (line.match(separatorRegex))
            hasSeparator = true;

        // Does line match criteria?
        if (line.includes("|") || line.match(captionRegex)) {
            startLine--; // Move up.
            rowIndex++;
            rememberEmptyLine = false;
        // Ignore a single empty line:
        } else if (line.trim() === "" && allowEmptyLine && !rememberEmptyLine) {
            startLine--; // Move up.
            rowIndex++;
            rememberEmptyLine = true;
        // Break once a line doesn't match criteria:
        } else {
            if (rememberEmptyLine) {
                startLine++; // Move back...
                rowIndex--;
            }
            break;
        }
    }
    startLine++; // Move back...
    rowIndex--;

    if (hasSeparator)
        rowIndex--;

    // Determine endLine:
    let endLine = cursor.line;
    while (endLine < cm.lineCount()) {
        let line = cm.getLine(endLine).trim();

        if (line.match(separatorRegex))
            hasSeparator = true;
        
        // Does line match criteria?
        if (line.includes("|") || line.match(captionRegex)) {
            endLine++; // Move down.
            rememberEmptyLine = false;
        // Ignore a single empty line:
        } else if (line.trim() === "" && !rememberEmptyLine) {
            endLine++; // Move down.
            rememberEmptyLine = true;
        // Break once a line doesn't match criteria:
        } else {
            if (rememberEmptyLine)
                endLine--; // Move back...
            break;
        }
    }
    endLine--; // Move back...

    if (hasSeparator)
        return {
            "range": createRange(
                createPosition(startLine, 0),
                createPosition(endLine, cm.getLine(endLine).length)
            ),
            "row": rowIndex,
            "column": determineColumnIndex(cm.getLine(cursor.line), cursor.ch)
        };
    else
        return null;
}


export function replaceAllTablesFunc(context, callback): Function {
    return async function() {
        const settings = await context.postMessage({ name: 'getSettings' });
        const cursor = this.getCursor();
        const ranges = getRangesOfAllTables(this, settings.selectedFormat == "multimd");
        if (ranges.length > 0) {
            let errors = [];
            for (let range of ranges) {
                try {
                    const table = this.getRange(range.from, range.to);
                    const result = await callback(table, settings);
                    if (result)
                        this.replaceRange(result, range.from, range.to);

                    await sleep(50); // Yes, this is absolutely necessary, otherwise CodeMirror only replaces every second table for reasons beyond me.
                }
                catch (error) {
                    errors.push(error);
                }
            }
            this.setCursor(cursor);
            if (errors.length > 0) {
                await context.postMessage({
                    name: 'alert',
                    text: `${errors.length} errors occured while formatting tables: \n` + errors.reduce((pv, cv) => pv.message + ", \n" + cv.message),
                    title: "Error"
                });
            }
        }
        else {
            await context.postMessage({
                name: 'alert',
                text: 'No tables found in the document.',
                title: "Error"
            });
        }
    };
}


export function replaceRangeFunc(context, callback): Function {
    return async function() {
        const settings = await context.postMessage({ name: 'getSettings' });
        const cursor = this.getCursor();
        const selection = getRangeOfTable(this, settings.selectedFormat == "multimd");
        if (selection !== null) {
            try {
                const table = this.getRange(selection.range.from, selection.range.to);
                const result = await callback(table, selection, settings);
                if (result)
                this.replaceRange(result, selection.range.from, selection.range.to);
                this.setCursor(cursor);
            }
            catch (error) {
                await context.postMessage({
                    name: 'alert',
                    text: error.toString(),
                    title: "Error"
                });
            }
        }
        else {
            await context.postMessage({
                name: 'alert',
                text: 'No table found at the cursors position.',
                title: "Error"
            });
        }
    };
}

export function replaceSelectionFunc(context, callback): Function {
    return async function() {
        const settings = await context.postMessage({ name: 'getSettings' });
        const table: string = this.getSelection();
        try {
            const result = await callback(table, settings);
            if (result)
                this.replaceSelection(result);
        }
        catch (error) {
            await context.postMessage({
                name: 'alert',
                text: error.toString(),
                title: "Error"
            });
        }
    };
}