import joplin from 'api';
import { MenuItem, MenuItemLocation, ToolbarButtonLocation } from 'api/types';
import { Dialog } from './dialogs';

interface Command {
    name: string,
    label: string,
    iconName: string,
    accelerator: string,
    menuItem: MenuItem,
    add: {
        toContextMenu: boolean,
        toToolsMenu: boolean, // Unused
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
        menuItem: {
            commandName: "createTable"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: true
        },
        execute: editorExecCommand("createTable")
    },
    {
        name: "formatTable",
        label: "Format table",
        iconName: null,
        accelerator: "CmdOrCtrl+Shift+F",
        menuItem: {
            commandName: "formatTable"
        },
        add: {
            toContextMenu: true,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("formatTable")
    },/*
    {
        name: "formatAllTables",
        label: "Format all tables",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "formatAllTables"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("formatAllTables")
    },*/
    {
        name: "minifyTable",
        label: "Minify table",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "minifyTable"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("minifyTable")
    },/*
    {
        name: "minifyAllTables",
        label: "Minify all tables",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "minifyAllTables"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("minifyAllTables")
    },*/
    {
        name: "convertSelectionToMarkdownTable",
        label: "Convert selection to Markdown table",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "convertSelectionToMarkdownTable"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("convertSelectionToMarkdownTable")
    },
    {
        name: "convertSelectionToHTMLTable",
        label: "Convert selection to HTML table",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "convertSelectionToHTMLTable"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("convertSelectionToHTMLTable")
    },
    {
        name: "tableAddRowAbove",
        label: "Table (+↑): Add row above",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableAddRowAbove"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableAddRowAbove")
    },
    {
        name: "tableAddRowBelow",
        label: "Table (+↓): Add row below ",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableAddRowBelow"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableAddRowBelow")
    },
    {
        name: "tableMoveRow",
        label: "Table (↕): Move row",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableMoveRow"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableMoveRow")
    },
    {
        name: "tableDeleteRow",
        label: "Table (-): Delete row",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableDeleteRow"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableDeleteRow")
    },
    {
        name: "tableAddColumnLeft",
        label: "Table (+←): Add column left",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableAddColumnLeft"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableAddColumnLeft")
    },
    {
        name: "tableAddColumnRight",
        label: "Table (+→): Add column right",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableAddColumnRight"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableAddColumnRight")
    },
    {
        name: "tableMoveColumn",
        label: "Table (↔): Move column",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableMoveColumn"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableMoveColumn")
    },
    {
        name: "tableDeleteColumn",
        label: "Table (-): Delete column",
        iconName: null,
        accelerator: null,
        menuItem: {
            commandName: "tableDeleteColumn"
        },
        add: {
            toContextMenu: false,
            toToolsMenu: true,
            asToolbarButton: false
        },
        execute: editorExecCommand("tableDeleteColumn")
    }
];

export function registerAllCommands() {
    commands.forEach(command => {
        joplin.commands.register({
            name: command.name,
            label: command.label,
            iconName: command.iconName,
            execute: command.execute
        });

        if (command.add.toContextMenu)
            if (command.accelerator !== null)
                joplin.views.menuItems.create(command.label, command.name, MenuItemLocation.EditorContextMenu, { accelerator: command.accelerator});
            else
                joplin.views.menuItems.create(command.label, command.name, MenuItemLocation.EditorContextMenu);

        if (command.add.asToolbarButton)
            joplin.views.toolbarButtons.create(command.label, command.name, ToolbarButtonLocation.EditorToolbar);
    });
    
    joplin.views.menus.create(
        "tableTools",
        "Table tools",
        commands.map(command => command.menuItem),
        MenuItemLocation.Tools);
}