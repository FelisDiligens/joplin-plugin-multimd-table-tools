import { Table } from "md-table-tools";
import { Editor, Position } from 'CodeMirror';
import { replaceRangeFunc, replaceSelectionFunc } from "./cmUtils";
import { getHTMLParser, getHTMLRenderer, getMarkdownParser, getMarkdownRenderer } from "./tableUtils";

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
                CodeMirror.defineExtension('formatAllTables', replaceRangeFunc(context, async (table, selection, settings) => {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }));
                CodeMirror.defineExtension('minifyAllTables', replaceRangeFunc(context, async (table, selection, settings) => {
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
                    Convert table:
                */
                CodeMirror.defineExtension('convertSelectionToMarkdownTable', replaceSelectionFunc(context, async (table, settings) => {
                    const parsedTable = getHTMLParser().parse(table);
                    return getMarkdownRenderer(settings.selectedFormat, true).render(parsedTable);
                }));
                CodeMirror.defineExtension('convertSelectionToHTMLTable', replaceSelectionFunc(context, async (table, settings) => {
                    const parsedTable = getMarkdownParser(settings.selectedFormat).parse(table);
                    return getHTMLRenderer().render(parsedTable);
                }));
            },
        }
    },
}