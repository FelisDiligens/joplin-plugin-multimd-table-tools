import joplin from 'api';
import { MenuItem, MenuItemLocation, ToolbarButtonLocation } from 'api/types';

interface Command {
    name: string,
    label: string,
    iconName: string,
    accelerator: string,
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
        execute: editorExecCommand("convertSelectionToCSVTable")
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
        execute: editorExecCommand("tableMoveColumn")
    },
    {
        name: "tableDeleteColumn",
        label: "Column (-): Delete",
        iconName: null,
        accelerator: null,
        add: {
            toContextMenu: false,
            toToolsMenu: "tableToolsColumn",
            asToolbarButton: false
        },
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
        execute: editorExecCommand("tableTextAlignClear")
    }
];

export function registerAllCommands(settings) {
    commands.forEach(command => {
        joplin.commands.register({
            name: command.name,
            label: command.label,
            iconName: command.iconName,
            execute: command.execute
        });

        if (command.add.toContextMenu && settings.allowAddToContextMenu) {
            if (command.accelerator !== null && settings.allowHotkeys)
                joplin.views.menuItems.create(command.label, command.name, MenuItemLocation.EditorContextMenu, { accelerator: command.accelerator});
            else
                joplin.views.menuItems.create(command.label, command.name, MenuItemLocation.EditorContextMenu);
        }

        if (command.add.asToolbarButton && settings.allowAddToToolbar) {
            joplin.views.toolbarButtons.create(command.label, command.name, ToolbarButtonLocation.EditorToolbar);
        }
    });
    
    joplin.views.menus.create(
        "tableTools",
        "Table tools",
        [
            ...commands
               .filter(command => command.add.toToolsMenu == "tableTools")
               .map(command => command.accelerator !== null && settings.allowHotkeys ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
            {
				label: 'Format',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsFormat")
                         .map(command => command.accelerator !== null && settings.allowHotkeys ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Row',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsRow")
                         .map(command => command.accelerator !== null && settings.allowHotkeys ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Column',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsColumn")
                         .map(command => command.accelerator !== null && settings.allowHotkeys ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Text',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsText")
                         .map(command => command.accelerator !== null && settings.allowHotkeys ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
            {
				label: 'Convert',
				submenu: commands
                         .filter(command => command.add.toToolsMenu == "tableToolsConvert")
                         .map(command => command.accelerator !== null && settings.allowHotkeys ? ({ commandName: command.name, accelerator: command.accelerator } as MenuItem) : ({ commandName: command.name } as MenuItem)),
			},
        ],
        MenuItemLocation.Tools);
}