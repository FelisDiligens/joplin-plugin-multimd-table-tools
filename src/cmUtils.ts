import { Editor, Position } from 'CodeMirror';

const separatorRegex = /^\|?([\s\.]*:?[\-=\.]+[:\+]?[\s\.]*\|?)+\|?$/;
const captionRegex = /^(\[.+\]){1,2}$/;

function createPosition(line: number, ch: number): Position {
    return {line, ch};
}

/**
 * Returns the range (line numbers and character numbers) of the table at the cursor. If there is no table at the cursor, it returns null.
 * @param cm The CodeMirror editor
 * @returns A range (Position[]) or null
 */
export function getRangeOfTable(cm: Editor) {
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
        } else if (line.trim() === "" && !rememberEmptyLine) {
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

    // Determine column:
    let row = cm.getLine(cursor.line).substring(0, cursor.ch).trim();
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

    if (hasSeparator)
        return {
            "range": [
                createPosition(startLine, 0),
                createPosition(endLine, cm.getLine(endLine).length)
            ],
            "row": rowIndex,
            "column": colIndex
        };
    else
        return null;
}


export function replaceRangeFunc(context, callback) {
    return async function() {
        const settings = await context.postMessage({ name: 'getSettings' });
        const cursor = this.getCursor();
        const selection = getRangeOfTable(this);
        if (selection !== null) {
            try {
                const table = this.getRange(selection.range[0], selection.range[1]);
                const result = await callback(table, selection, settings);
                if (result)
                this.replaceRange(result, selection.range[0], selection.range[1]);
                this.setCursor(cursor);
            }
            catch (error) {
                await context.postMessage({
                    name: 'alert',
                    text: error.toString()
                });
            }
        }
        else {
            await context.postMessage({
                name: 'alert',
                text: 'No table found at the cursors position.'
            });
        }
    };
}

export function replaceSelectionFunc(context, callback) {
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
                text: error.toString()
            });
        }
    };
}