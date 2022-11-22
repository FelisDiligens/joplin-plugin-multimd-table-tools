import { Table, TextAlignment } from "md-table-tools";
import { replaceAllTablesFunc, replaceRangeFunc, replaceSelectionFunc } from "./cmUtils";
import { getCSVRenderer, getHTMLParser, getHTMLRenderer, getMarkdownParser, getMarkdownRenderer, parseTable } from "./tableUtils";

module.exports = {
    default: function(context) {
        return {
            plugin: function(CodeMirror) {
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
                            text: error.toString()
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
                CodeMirror.defineExtension('tableAddRowBelow', replaceRangeFunc(context, async (table, selection, settings) => {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                    parsedTable.addRow(selection.row + 1);
                    parsedTable.update();
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }));
                CodeMirror.defineExtension('tableDeleteRow', replaceRangeFunc(context, async (table, selection, settings) => {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                    let confirm = await context.postMessage({
                        name: 'confirm',
                        text: "Are you sure you want to delete the current row?"
                    });
                    if (confirm) {
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
                CodeMirror.defineExtension('tableAddColumnRight', replaceRangeFunc(context, async (table, selection, settings) => {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                    parsedTable.addColumn(selection.column + 1);
                    parsedTable.update();
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }));
                CodeMirror.defineExtension('tableDeleteColumn', replaceRangeFunc(context, async (table, selection, settings) => {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                    let confirm = await context.postMessage({
                        name: 'confirm',
                        text: "Are you sure you want to delete the current column?"
                    });
                    if (confirm) {
                        parsedTable.removeColumn(selection.column);
                        parsedTable.update();
                        return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                    }
                    return null;
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
                    return null;
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
                        await context.postMessage({ name: 'alert', text: "Error: Couldn't detect table format.\nPlease make sure to select the table fully. Only HTML, Markdown, and CSV are supported." });
                }));
                CodeMirror.defineExtension('convertSelectionToHTMLTable', replaceSelectionFunc(context, async (table, settings) => {
                    const parsedTable = parseTable(table, settings.selectedFormat);
                    if (parsedTable)
                        return getHTMLRenderer().render(parsedTable);
                    else
                        await context.postMessage({ name: 'alert', text: "Error: Couldn't detect table format.\nPlease make sure to select the table fully. Only HTML, Markdown, and CSV are supported." });
                }));
                CodeMirror.defineExtension('convertSelectionToCSVTable', replaceSelectionFunc(context, async (table, settings) => {
                    const parsedTable = parseTable(table, settings.selectedFormat);
                    if (parsedTable)
                        return getCSVRenderer().render(parsedTable);
                    else
                        await context.postMessage({ name: 'alert', text: "Error: Couldn't detect table format.\nPlease make sure to select the table fully. Only HTML, Markdown, and CSV are supported." });
                }));
            },
        }
    },
}