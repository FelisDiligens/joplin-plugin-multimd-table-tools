import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { registerAllCommands } from './commands';
import { Dialog, Dialogs } from './dialogs';
import { getSettings, registerAllSettings } from './settings';

let settings;
let alertDialog;
let confirmDialog;
let dialogNewTable;
let dialogMoveRow;
let dialogMoveColumn;

joplin.plugins.register({
    onStart: async function() {
        alertDialog = await Dialogs.CreateAlertDialog();
        confirmDialog = await Dialogs.CreateConfirmDialog();
        dialogNewTable = await Dialogs.CreateNewTableDialog();
        dialogMoveRow = await Dialogs.CreateMoveRowDialog();
        dialogMoveColumn = await Dialogs.CreateMoveColumnDialog();

        await registerAllSettings();
        settings = await getSettings();
        
        await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, "MultiMarkdownTableTools", "./cmPlugin.js");

        await registerAllCommands(settings.allowAddToToolbar, settings.allowAddToContextMenu);

        if (settings.useMarkdownItExtension) {
            await joplin.contentScripts.register(
                ContentScriptType.MarkdownItPlugin,
                'markdown-it-multimd-table',
                './markdownItExtention.js'
            );
        }

        await joplin.contentScripts.onMessage("MultiMarkdownTableTools", async (message: any) => {
            switch (message.name) {
                case "getSettings":
                    return await getSettings();
                case "alert":
                    settings = await getSettings();
                    if (settings.useNativeDialogs) {
                        alert(`${message.title}: ${message.text}`);
                        return { id: "ok", confirm: true, formData: {} };
                    }
                    else {
                        alertDialog.useTemplate({
                            "text": message.text,
                            "title": message.title
                        });
                        await alertDialog.open();
                        return alertDialog.getPreparedDialogResult();
                    }
                    
                case "confirm":
                    settings = await getSettings();
                    if (settings.useNativeDialogs) {
                        let result = confirm(`${message.title}: ${message.text}`);
                        return { id: result ? "ok" : "cancel", confirm: result, formData: {} };
                    }
                    else {
                        confirmDialog.useTemplate({
                            "text": message.text,
                            "title": message.title
                        });
                        await confirmDialog.open();
                        return confirmDialog.getPreparedDialogResult();
                    }
                case "dialog.createNewTable":
                case "dialog.createTable":
                case "dialog.newTable":
                    dialogNewTable.useTemplate();
                    await dialogNewTable.open();
                    return dialogNewTable.getPreparedDialogResult();
                case "dialog.moveRow":
                    dialogMoveRow.useTemplate({
                        "currentIndex": message.currentIndex + 1,
                        "rowCount": message.rowCount
                    });
                    dialogMoveRow.setDefaultFormData({
                        "newindex": message.currentIndex + 1
                    });
                    await dialogMoveRow.open();
                    return dialogMoveRow.getPreparedDialogResult();
                case "dialog.moveColumn":
                    dialogMoveColumn.useTemplate({
                        "currentIndex": message.currentIndex + 1,
                        "columnCount": message.columnCount
                    });
                    dialogMoveColumn.setDefaultFormData({
                        "newindex": message.currentIndex + 1
                    });
                    await dialogMoveColumn.open();
                    return dialogMoveColumn.getPreparedDialogResult();
                default:
                    return "Error: " + message + " is not a valid message";
            }
        });
    },
});
