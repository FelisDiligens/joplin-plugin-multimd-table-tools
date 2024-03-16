import joplin from 'api';
import { MenuItem, MenuItemLocation, ToolbarButtonLocation } from 'api/types';
import { getSettings } from './settings';
import { getMarkdownRenderer, parseTable } from './tableUtils';

/** Only affects context menu items */
enum CommandCondition {
    None,
    CursorInTable,
    Selection
}

interface Command {
    name: string,
    label: string,
    iconName: string,
    accelerator: string,
    condition: CommandCondition,
    add: {
        toContextMenu: boolean,
        toToolsMenu: string,
        asToolbarButton: boolean
    },
    execute: () => Promise<any>
}

function editorExecCommand(commandName: string): () => Promise<any> {
    return async () => {
        await joplin.commands.execute('editor.execCommand', { name: commandName, });
    };
}

const commands : Command[] = [
    {
        name: "createTable",
        label: "Create new table",
        iconName: "fas fa-table",
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableTools",
            asToolbarButton: true
        },
        condition: CommandCondition.None,
        execute: editorExecCommand("createTable")
    },
    {
        name: "formatTable",
        label: "Format table",
        iconName: null,
        accelerator: "CmdOrCtrl+Shift+F",
        add: {
            toContextMenu: true,
            toToolsMenu: "tableToolsFormat",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("formatTable")
    },
    {
        name: "formatAllTables",
        label: "Format all tables",
        iconName: "fas fa-star-of-life", // fas fa-table-cells, icon-table2
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsFormat",
            asToolbarButton: true
        },
        condition: CommandCondition.None,
        execute: editorExecCommand("formatAllTables")
    },
    {
        name: "minifyTable",
        label: "Minify table",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsFormat",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("minifyTable")
    },
    {
        name: "minifyAllTables",
        label: "Minify all tables",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsFormat",
            asToolbarButton: false
        },
        condition: CommandCondition.None,
        execute: editorExecCommand("minifyAllTables")
    },
    {
        name: "convertSelectionToMarkdownTable",
        label: "Convert selection to Markdown table",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsConvert",
            asToolbarButton: false
        },
        condition: CommandCondition.Selection,
        execute: editorExecCommand("convertSelectionToMarkdownTable")
    },
    {
        name: "convertSelectionToHTMLTable",
        label: "Convert selection to HTML table",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsConvert",
            asToolbarButton: false
        },
        condition: CommandCondition.Selection,
        execute: editorExecCommand("convertSelectionToHTMLTable")
    },
    {
        name: "convertSelectionToCSVTable",
        label: "Convert selection to CSV table",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsConvert",
            asToolbarButton: false
        },
        condition: CommandCondition.Selection,
        execute: editorExecCommand("convertSelectionToCSVTable")
    },
    {
        name: "pasteAsMarkdownTable",
        label: "Paste table as Markdown",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: true,
            toToolsMenu: "tableToolsPaste",
            asToolbarButton: false
        },
        condition: CommandCondition.None,
        execute: async () => {
            let table: string = await joplin.clipboard.readText();

			// if clipboard is empty, skip
			if (!table?.length)
                return;
            
            const settings = await getSettings();
            let intermediaryTable = parseTable(table, settings.selectedFormat);

            // If table couldn't be parsed, skip
            if (intermediaryTable == null)
                return;

            // Render to markdown and paste into editor:
            let mdTable = getMarkdownRenderer(settings.selectedFormat, true).render(intermediaryTable);
			await joplin.commands.execute("insertText", mdTable);
			await joplin.commands.execute('editor.focus');
        }
    },
    {
        name: "tableAddRowAbove",
        label: "Row (+): Add above ↑",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsRow",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableAddRowAbove")
    },
    {
        name: "tableAddRowBelow",
        label: "Row (+): Add below ↓",
        iconName: "fas fa-grip-lines", // fas fa-plus, fas fa-equals, fas fa-square-plus, fas fa-table-rows, fas fa-diagram-next
        accelerator: "CmdOrCtrl+Enter",
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsRow",
            asToolbarButton: true
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableAddRowBelow")
    },
    {
        name: "tableMoveRow",
        label: "Row (↕): Move",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsRow",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableMoveRow")
    },
    {
        name: "tableDeleteRow",
        label: "Row (-): Delete",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsRow",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableDeleteRow")
    },
    {
        name: "tableAddColumnLeft",
        label: "Column (+): Add left ←",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsColumn",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableAddColumnLeft")
    },
    {
        name: "tableAddColumnRight",
        label: "Column (+): Add right →",
        iconName: "fas fa-grip-lines-vertical", // fas fa-plus, fas fa-square-plus, fa-table-columns
        accelerator: "CmdOrCtrl+Tab",
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsColumn",
            asToolbarButton: true
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableAddColumnRight")
    },
    {
        name: "tableMoveColumn",
        label: "Column (↔): Move",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsColumn",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableMoveColumn")
    },
    {
        name: "tableDeleteColumn",
        label: "Column (-): Delete",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: true,
            toToolsMenu: "tableToolsColumn",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableDeleteColumn")
    },
    {
        name: "tableTextAlignLeft",
        label: "Text: Align left ←",
        iconName: "fas fa-align-left",
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsText",
            asToolbarButton: true
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableTextAlignLeft")
    },
    {
        name: "tableTextAlignCenter",
        label: "Text: Align center ↔",
        iconName: "fas fa-align-center",
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsText",
            asToolbarButton: true
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableTextAlignCenter")
    },
    {
        name: "tableTextAlignRight",
        label: "Text: Align right →",
        iconName: "fas fa-align-right",
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsText",
            asToolbarButton: true
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableTextAlignRight")
    },
    {
        name: "tableTextAlignClear",
        label: "Text: Clear alignment",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsText",
            asToolbarButton: false
        },
        condition: CommandCondition.CursorInTable,
        execute: editorExecCommand("tableTextAlignClear")
    }
];

export async function registerAllCommands(settings) {
    commands.forEach(command => {
        // Register each command:
        joplin.commands.register({
            name: command.name,
            label: command.label,
            enabledCondition: 'markdownEditorPaneVisible && !richTextEditorVisible',
            iconName: command.iconName,
            execute: command.execute
        });

        // Add toolbar buttons:
        if (command.add.asToolbarButton && settings.allowAddToToolbar) {
            joplin.views.toolbarButtons.create(command.label, command.name, ToolbarButtonLocation.EditorToolbar);
        }
    });
    
    // Add all actions to Tools -> Table tools -> *
    joplin.views.menus.create(
        "tableTools",
        "Table tools",
        [
            ...commands
               .filter(command => command.add.toToolsMenu == "tableTools")
               .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
            {
				label: 'Format',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsFormat")
                         .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Row',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsRow")
                         .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Column',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsColumn")
                         .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Text',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsText")
                         .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Convert',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsConvert")
                         .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Paste',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsPaste")
                         .map(command => command.accelerator !== null && settings.allowAccelerators ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
        ],
        MenuItemLocation.Tools);

    // Add (and filter) context menu items:
    await joplin.workspace.filterEditorContextMenu(async (object: any) => {
        const newItems: MenuItem[] = [];

        let inTable = await joplin.commands.execute('editor.execCommand', {
            name: 'isCursorInTable',
        });

        let hasSelection = await joplin.commands.execute('editor.execCommand', {
            name: 'hasSelection',
        });

        if (settings.allowAddToContextMenu) {
            commands.forEach(command => {
                if (command.add.toContextMenu) {
                    // Filter command depending on chosen condition:
                    if (command.condition == CommandCondition.CursorInTable && !inTable)
                        return;
                    if (command.condition == CommandCondition.Selection && !hasSelection)
                        return;

                    // Add command to context menu:
                    if (command.accelerator !== null && settings.allowAccelerators) {
                        newItems.push({
                            label: command.label,
                            commandName: command.name,
                            accelerator: command.accelerator
                        });
                    } else {
                        newItems.push({
                            label: command.label,
                            commandName: command.name
                        });
                    }
                }
            });
        }

        if (newItems.length) {
            newItems.splice(0, 0, {
                type: 'separator',
            });

            object.items = object.items.concat(newItems);
        }

        return object;
    });
}