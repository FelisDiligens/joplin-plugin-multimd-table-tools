import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { registerAllCommands } from './commands';
import { Dialog, Dialogs } from './dialogs';
import { getSettings, registerAllSettings } from './settings';

joplin.plugins.register({
    onStart: async function() {
        await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, "MultiMarkdownTableTools", "./cmPlugin.js");

        await registerAllCommands();
        await registerAllSettings();

        const settings = await getSettings();

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
                    alert(`${message.text}`);
                    break;
                case "confirm":
                    return confirm(`${message.text}`);
                case "dialog.createNewTable":
                case "dialog.createTable":
                case "dialog.newTable":
                    let dialogNewTable = await Dialogs.CreateNewTableDialog();
                    await dialogNewTable.open();
                    return dialogNewTable.getPreparedDialogResult();
                case "dialog.moveRow":
                    let dialogMoveRow = await Dialogs.CreateMoveRowDialog(message.currentIndex, message.rowCount);
                    await dialogMoveRow.open();
                    return dialogMoveRow.getPreparedDialogResult();
                case "dialog.moveColumn":
                    let dialogMoveColumn = await Dialogs.CreateMoveColumnDialog(message.currentIndex, message.columnCount);
                    await dialogMoveColumn.open();
                    return dialogMoveColumn.getPreparedDialogResult();
                default:
                    return "Error: " + message + " is not a valid message";
            }
        });
    },
});
