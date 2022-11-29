import { Editor } from "codemirror";
import { Table, TextAlignment } from "md-table-tools";
import { createPosition, getColumnRanges, getRangeOfTable, isCursorInTable, replaceAllTablesFunc, replaceRange, replaceRangeFunc, replaceSelectionFunc } from "./cmUtils";
import { getCSVRenderer, getHTMLRenderer, getMarkdownParser, getMarkdownRenderer, parseTable } from "./tableUtils";

const separatorRegex = /^\|?([\s\.]*:?[\-=\.]+[:\+]?[\s\.]*\|?)+\|?$/;

module.exports = {
    default: function(context) {
        const plugin = function(CodeMirror) {
            /*
                Create new table:
            */

            CodeMirror.defineExtension('createTable', async function() {
                const settings = await context.postMessage({ name: 'getSettings' });
                try {
                    let result = await context.postMessage({
                        name: "dialog.createTable"
                    });
                    if (result.confirm) {
                        let rows = parseInt(result.formData.rows);
                        let columns = parseInt(result.formData.columns);
                        let hasheader = result.formData.hasheader;

                        let newTable = new Table(rows, columns);
                        if (hasheader == "on")
                            newTable.addRow(0).isHeader = true;
                        newTable.update();

                        this.replaceSelection(getMarkdownRenderer(settings.selectedFormat, true).render(newTable));
                    }
                }
                catch (error) {
                    await context.postMessage({
                        name: 'alert',
                        text: error.toString(),
                        title: "Error"
                    });
                }
            });


            /*
                Format table:
            */

            CodeMirror.defineExtension('formatTable', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('minifyTable', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                return getMarkdownRenderer(settings.selectedFormat, false).render(parsedTable);
            }));

            CodeMirror.defineExtension('formatAllTables', replaceAllTablesFunc(context, async (table, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('minifyAllTables', replaceAllTablesFunc(context, async (table, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                return getMarkdownRenderer(settings.selectedFormat, false).render(parsedTable);
            }));


            /*
                Edit rows:
            */

            CodeMirror.defineExtension('tableAddRowAbove', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                parsedTable.addRow(selection.row);
                parsedTable.update();
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('tableAddRowBelow', async function() {
                let cm = this;
                const settings = await context.postMessage({ name: 'getSettings' });
                replaceRange(this, context,
                    (table, selection, settings) => {
                        const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                        parsedTable.addRow(selection.row + 1);
                        parsedTable.update();
                        return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                    }, () => {
                        const cursor = cm.getCursor();
                        if (cm.getLine(cursor.line + 1).includes("|")) {
                            let col = getColumnRanges(cm.getLine(cursor.line + 1), createPosition(cursor.line + 1, 0));
                            if (col.ranges.length > 0) {
                                cm.focus();
                                switch (settings.tabBehavior) {
                                    case "jumpToStart":
                                        cm.setCursor(col.firstRange.from);
                                        break;
                                    case "jumpToEnd":
                                        cm.setCursor(col.firstRange.to);
                                        break;
                                    case "selectContent":
                                        cm.setSelection(col.firstRange.from, col.firstRange.to);
                                        break;
                                }
                                cm.refresh(); // This is required for the cursor to actually be visible
                            }
                        }
                    }
                );
            });

            CodeMirror.defineExtension('tableDeleteRow', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                let result = await context.postMessage({
                    name: 'confirm',
                    text: "Are you sure you want to delete the current row?",
                    title: "Delete row?"
                });
                if (result.confirm) {
                    parsedTable.removeRow(selection.row);
                    parsedTable.update();
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }
                return null;
            }));

            CodeMirror.defineExtension('tableMoveRow', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                let result = await context.postMessage({
                    name: "dialog.moveRow",
                    currentIndex: selection.row,
                    rowCount: parsedTable.rowCount()
                });
                if (result.confirm) {
                    let newIndex = parseInt(result.formData.newindex) - 1;
                    parsedTable.moveRow(selection.row, newIndex);
                    parsedTable.update();
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }
                return null;
            }));
            

            /*
                Edit columns:
            */
           
            CodeMirror.defineExtension('tableAddColumnLeft', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                parsedTable.addColumn(selection.column);
                parsedTable.update();
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('tableAddColumnRight', async function() {
                let cm = this;
                const settings = await context.postMessage({ name: 'getSettings' });
                replaceRange(this, context,
                    (table, selection, settings) => {
                        const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                        parsedTable.addColumn(selection.column + 1);
                        parsedTable.update();
                        return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                    }, (selection) => {
                        const cursor = cm.getCursor();
                        if (cm.getLine(cursor.line).includes("|")) {
                            let col = getColumnRanges(cm.getLine(cursor.line), cursor, selection.column);
                            if (col.ranges.length > 0 && col.nextRange) {
                                cm.focus();
                                switch (settings.tabBehavior) {
                                    case "jumpToStart":
                                        cm.setCursor(col.nextRange.from);
                                        break;
                                    case "jumpToEnd":
                                        cm.setCursor(col.nextRange.to);
                                        break;
                                    case "selectContent":
                                        cm.setSelection(col.nextRange.from, col.nextRange.to);
                                        break;
                                }
                                cm.refresh(); // This is required for the cursor to actually be visible
                            }
                        }
                    }
                );
            });

            CodeMirror.defineExtension('tableDeleteColumn', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                let result = await context.postMessage({
                    name: 'confirm',
                    text: "Are you sure you want to delete the current column?",
                    title: "Delete column?"
                });
                if (result.confirm) {
                    parsedTable.removeColumn(selection.column);
                    parsedTable.update();
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }
            }));

            CodeMirror.defineExtension('tableMoveColumn', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                let result = await context.postMessage({
                    name: "dialog.moveColumn",
                    currentIndex: selection.column,
                    columnCount: parsedTable.columnCount()
                });
                if (result.confirm) {
                    let newIndex = parseInt(result.formData.newindex) - 1;
                    parsedTable.moveColumn(selection.column, newIndex);
                    parsedTable.update();
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }
            }));
            

            /*
                Change text alignment:
            */

            CodeMirror.defineExtension('tableTextAlignLeft', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                parsedTable.getColumn(selection.column).textAlign = TextAlignment.left;
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('tableTextAlignCenter', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                parsedTable.getColumn(selection.column).textAlign = TextAlignment.center;
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('tableTextAlignRight', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                parsedTable.getColumn(selection.column).textAlign = TextAlignment.right;
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));

            CodeMirror.defineExtension('tableTextAlignClear', replaceRangeFunc(context, async (table, selection, settings) => {
                const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                parsedTable.getColumn(selection.column).textAlign = TextAlignment.default;
                return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
            }));


            /*
                Convert table:
            */

            CodeMirror.defineExtension('convertSelectionToMarkdownTable', replaceSelectionFunc(context, async (table, settings) => {
                const parsedTable = parseTable(table, settings.selectedFormat);
                if (parsedTable)
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                else
                    await context.postMessage({
                        name: 'alert',
                        text: "Couldn't detect table format.\nPlease make sure to select the table fully. Only HTML, Markdown, and CSV are supported.",
                        title: "Error"
                    });
            }));

            CodeMirror.defineExtension('convertSelectionToHTMLTable', replaceSelectionFunc(context, async (table, settings) => {
                const parsedTable = parseTable(table, settings.selectedFormat);
                if (parsedTable)
                    return getHTMLRenderer().render(parsedTable);
                else
                    await context.postMessage({
                        name: 'alert',
                        text: "Couldn't detect table format.\nPlease make sure to select the table fully. Only HTML, Markdown, and CSV are supported.",
                        title: "Error"
                    });
            }));

            CodeMirror.defineExtension('convertSelectionToCSVTable', replaceSelectionFunc(context, async (table, settings) => {
                const parsedTable = parseTable(table, settings.selectedFormat);
                if (parsedTable)
                    return getCSVRenderer().render(parsedTable);
                else
                    await context.postMessage({
                        name: 'alert',
                        text: "Couldn't detect table format.\nPlease make sure to select the table fully. Only HTML, Markdown, and CSV are supported.",
                        title: "Error"
                    });
            }));

            /*
                Hotkeys:
                Tab, Shift+Tab, Enter
            */
            CodeMirror.defineOption('tableToolsHotkeys', false, (cm: Editor, value: boolean) => {
                cm.on('cursorActivity', async () => {
                    const settings = await context.postMessage({ name: 'getSettings' });
                    var insideTable = isCursorInTable(cm, settings.selectedFormat == "multimd");

                    // if the cursor is in the table and hotkeys are allowed:
                    if (insideTable && settings.allowHotkeys) {
                        const cursor = cm.getCursor();

                        cm.setOption("extraKeys", {
                            // Insert <br> instead of normal newline:
                            "Enter": (cm) => {
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
                    } else {
                        // Disable the extraKeys when the cursor is not in the table:
                        cm.setOption("extraKeys", {});
                    }
                });
            });
        }

        return {
            plugin,
            codeMirrorOptions: {
                'tableToolsHotkeys': true,
            }
        }
    }
}