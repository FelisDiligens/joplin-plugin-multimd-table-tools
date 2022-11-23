import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { registerAllCommands } from './commands';
import { Dialog, Dialogs } from './dialogs';
import { getSettings, registerAllSettings } from './settings';

let settings;
let dialogAlert;
let dialogConfirm;
let dialogNewTable;
let dialogMoveRow;
let dialogMoveColumn;

joplin.plugins.register({
    onStart: async function() {
        dialogAlert = await Dialogs.createAlertDialog();
        dialogConfirm = await Dialogs.createConfirmDialog();
        dialogNewTable = await Dialogs.createNewTableDialog();
        dialogMoveRow = await Dialogs.createMoveRowDialog();
        dialogMoveColumn = await Dialogs.createMoveColumnDialog();

        await registerAllSettings();
        settings = await getSettings();
        
        await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, "MultiMarkdownTableTools", "./cmPlugin.js");

        await registerAllCommands(settings);

        if (settings.useMarkdownItExtension) {
            await joplin.contentScripts.register(
                ContentScriptType.MarkdownItPlugin,
                'markdown-it-multimd-table',
                './markdownItExtension.js'
            );
        }

        await joplin.contentScripts.onMessage("MultiMarkdownTableTools", async (message: any) => {
            switch (message.name) {
                case "getSettings":
                    return await getSettings();
                case "alert":
                    settings = await getSettings();
                    return await Dialogs.openAlertDialog(dialogAlert, message.text, message.title, settings.useNativeDialogs);
                case "confirm":
                    settings = await getSettings();
                    return await Dialogs.openConfirmDialog(dialogConfirm, message.text, message.title, settings.useNativeDialogs);
                case "dialog.createNewTable":
                case "dialog.createTable":
                case "dialog.newTable":
                    return await Dialogs.openNewTableDialog(dialogNewTable);
                case "dialog.moveRow":
                    return await Dialogs.openMoveRowDialog(dialogMoveRow, message.currentIndex, message.rowCount);
                case "dialog.moveColumn":
                    return await Dialogs.openMoveColumnDialog(dialogMoveColumn, message.currentIndex, message.columnCount);
                default:
                    return "Error: " + message + " is not a valid message";
            }
        });
    },
});
