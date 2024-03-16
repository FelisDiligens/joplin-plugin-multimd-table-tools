import { getMarkdownParser, getMarkdownRenderer } from "../tableUtils";
import { createPosition, getColumnRanges, getRangeOfTable, separatorRegex } from "./cmUtils";

type KeyCommand = (cm: any)=>void;

/**
 * Creates keyboard commands for table editing and navigation.
 * 
 * @param settings Record containing the plugin's user-configurable settings.
 * @returns Keyboard commands that can be used directly with CodeMirror 5 or, after modification,
 *          with CodeMirror 6.
 */
const makeKeyCommands = (settings: Record<string, any>): Record<string, KeyCommand> => ({
    // Insert <br> instead of normal newline:
    "Enter": (cm) => {
        if (settings.enterBehavior == "disabled") {
            cm.replaceSelection('\n');
            return;
        }

        const cursor = cm.getCursor();
        var line = cm.getLine(cursor.line);
        var substr = line.substring(cursor.ch, line.length);

        // Check if the cursor is within the table:
        if (settings.enterBehavior == "insertBrTag" &&
            (!line.trim().startsWith("|") || (substr.includes("|") && cursor.ch != 0))) {
            cm.replaceSelection('<br>');
        } else {
            cm.replaceSelection('\n');
        }
    },
    // Jump to next cell:
    "Tab": (cm) => {
        if (settings.tabBehavior == "disabled") {
            cm.replaceSelection('\t');
            return;
        }

        // Get the cursor before formatting -- formatting the table can move the cursor.
        const cursor = cm.getCursor();

        let colIndex = -1;
        if (settings.formatOnTab) {
            try {
                const selection = getRangeOfTable(cm, settings.selectedFormat == "multimd");
                if (selection !== null) {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(cm.getRange(selection.range.from, selection.range.to));
                    const formattedTable = getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                    if (formattedTable)
                        cm.replaceRange(formattedTable, selection.range.from, selection.range.to);
                    colIndex = selection.column;
                }
            } catch (err) {
                console.error(`Couldn't format table on TAB: ${err}`);
            }
        }

        let col = getColumnRanges(cm.getLine(cursor.line), cursor, colIndex);
        let range;
        // Does next cell exist in row?
        if (col.nextRange) {
            // then select that cell:
            range = col.nextRange;
        } else {
            // if not, first select to the current cell:
            range = col.currentRange;
            // skip separator row:
            let i = cm.getLine(cursor.line + 1).match(separatorRegex) ? 2 : 1;
            // then check, if next row exist and select the first cell in the next row:
            if (cm.getLine(cursor.line + i).includes("|")) {
                col = getColumnRanges(cm.getLine(cursor.line + i), createPosition(cursor.line + i, 0));
                if (col.ranges.length > 0)
                    range = col.firstRange;
            }
        }

        if (range) {
            cm.focus();
            switch (settings.tabBehavior) {
                case "jumpToStart":
                    cm.setCursor(range.from);
                    break;
                case "jumpToEnd":
                    cm.setCursor(range.to);
                    break;
                case "selectContent":
                    cm.setSelection(range.from, range.to);
                    break;
            }
            cm.refresh(); // This is required for the cursor to actually be visible
        }
    },
    // Jump to previous cell:
    "Shift-Tab": (cm) => {
        if (settings.tabBehavior == "disabled") {
            cm.replaceSelection('\t');
            return;
        }

        const cursor = cm.getCursor();

        let colIndex = -1;
        if (settings.formatOnTab) {
            try {
                const selection = getRangeOfTable(cm, settings.selectedFormat == "multimd");
                if (selection !== null) {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(cm.getRange(selection.range.from, selection.range.to));
                    const formattedTable = getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                    if (formattedTable)
                        cm.replaceRange(formattedTable, selection.range.from, selection.range.to);
                    colIndex = selection.column;
                }
            } catch (err) {
                console.error(`Couldn't format table on TAB: ${err}`);
            }
        }

        let col = getColumnRanges(cm.getLine(cursor.line), cursor, colIndex);
        let range;
        // Does previous cell exist in row?
        if (col.previousRange) {
            // then select that cell:
            range = col.previousRange;
        } else {
            // if not, first select to the current cell:
            range = col.currentRange;
            // skip separator row:
            let i = cm.getLine(cursor.line - 1).match(separatorRegex) ? 2 : 1;
            // then check, if previous row exist and select the last cell in the previous row:
            if (cm.getLine(cursor.line - i).includes("|")) {
                col = getColumnRanges(cm.getLine(cursor.line - i), createPosition(cursor.line - i, 0));
                if (col.ranges.length > 0)
                    range = col.lastRange;
            }
        }

        if (range) {
            cm.focus();
            switch (settings.tabBehavior) {
                case "jumpToStart":
                    cm.setCursor(range.from);
                    break;
                case "jumpToEnd":
                    cm.setCursor(range.to);
                    break;
                case "selectContent":
                    cm.setSelection(range.from, range.to);
                    break;
            }
            cm.refresh(); // This is required for the cursor to actually be visible
        }
    }
});

export default makeKeyCommands;