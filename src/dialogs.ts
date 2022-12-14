import joplin from "api";
import { ButtonSpec, DialogResult } from "api/types";

/** Wrapper around Joplin's dialogs API. */
export class Dialog {
    private id: string;
    private viewHandle: string;
    private dialogResult: DialogResult;
    private defaultFormData: Object;
    private positiveIds: string[];
    public template: string;

    private makeid(length) {
        // https://stackoverflow.com/a/1349426
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    constructor() {
        this.id = this.makeid(32);
        this.defaultFormData = {};
        this.positiveIds = ["ok", "yes", "accept"];
        this.template = "";
    }

    public async create() {
        this.viewHandle = await joplin.views.dialogs.create(this.id);
        await joplin.views.dialogs.addScript(this.viewHandle, './webview_dialog.css');
    }

    /**
     * Sets the dialog HTML content
     * @see {@link joplin.views.dialogs.setHtml}
     * @param html
     */
    public async setHtml(html: string) {
        return await joplin.views.dialogs.setHtml(this.viewHandle, html);
    }

    public async useTemplate(obj: {} = {}) {
        let html = this.template;
        for (var key of Object.keys(obj)) {
            html = html.replace(
                new RegExp(`\{${key}\}`, "g"),
                typeof obj[key] == "string" ? obj[key].replace(/\r?\n/g, "<br>") : obj[key].toString());
        }
        return await this.setHtml(html);
    }

    /**
     * Sets the dialog buttons.
     * @see {@link joplin.views.dialogs.setButtons}
     * @param buttons
     */
    public async setButtons(buttons: ButtonSpec[]) {
        return await joplin.views.dialogs.setButtons(this.viewHandle, buttons);
    }

    public addPositiveIds(...ids: string[]) {
        this.positiveIds.push(...ids);
    }

    /**
     * Opens the dialog
     * @see {@link joplin.views.dialogs.open}
     */
    public async open(): Promise<DialogResult> {
        this.dialogResult = await joplin.views.dialogs.open(this.viewHandle);
        return this.dialogResult;
    }

    public getDialogResult(): DialogResult {
        return this.dialogResult;
    }

    public getPreparedDialogResult(defaultFormData: Object = this.defaultFormData): {id: string, confirm: boolean, formData: Object} {
        return {
            "id": this.getPressedButton(),
            "confirm": this.getAnswer(),
            "formData": this.getFormData(defaultFormData)
        }
    }

    public setDefaultFormData(defaultFormData: Object = {}) {
        this.defaultFormData = defaultFormData;
    }

    public getFormData(defaultFormData: Object = this.defaultFormData): Object {
        if (this.dialogResult.formData) {
            let formData = Object.assign({}, defaultFormData);
            Object.values(this.dialogResult.formData).forEach(obj => Object.assign(formData, obj));
            return formData;
        }
        return {};
    }

    public getPressedButton(): string {
        return this.dialogResult.id;
    }

    public getAnswer(): boolean {
        return this.positiveIds.includes(this.getPressedButton());
    }
}

export class Dialogs {
    public static async createNewTableDialog(): Promise<Dialog> {
        let dialog = new Dialog();
        await dialog.create();
        await dialog.setButtons([{id: "createTable", title: "Create table"}, {id: "cancel"}]);
        dialog.addPositiveIds("createTable");
        dialog.template = `
            <div>
                <h3>Create new table</h3>
                <form>
                    <table>
                        <tr>
                            <td>Rows:</td>
                            <td><input type="number" name="rows" value="1" min="1" max="100"></td>
                        </tr>
                        <tr>
                            <td>Columns:</td>
                            <td><input type="number" name="columns" value="1" min="1" max="100"></td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <input type="checkbox" id="hasheader" name="hasheader" checked><label for="hasheader">Has header</label>
                            </td>
                        </tr>
                    </table>
                </form>
            </div>
        `;
        dialog.setDefaultFormData({
            "rows": 1,
            "columns": 1,
            "hasheader": "off"
        });
        return dialog;
    }

    public static async openNewTableDialog(dialog: Dialog) {
        dialog.useTemplate();
        await dialog.open();
        return dialog.getPreparedDialogResult();
    }

    /*public static async postNewTableDialog(context) {
        return await context.postMessage({
            name: "dialog.createTable"
        });
    }*/

    public static async createMoveRowDialog(): Promise<Dialog> {
        let dialog = new Dialog();
        await dialog.create();
        await dialog.setButtons([{id: "move", title: "Move"}, {id: "cancel"}]);
        dialog.addPositiveIds("move");
        dialog.template = `
            <div>
                <h3>Move row</h3>
                <p>To which position do you want to move the selected row?</p>
                <p><em>The row is currently at position {currentIndex}</em></p>
                <form>
                    <p><strong>New position:</strong></p>
                    <input type="number" name="newindex" value="{currentIndex}" min="1" max="{rowCount}">
                </form>
            </div>
        `;
        dialog.setDefaultFormData({
            "newindex": 1
        });
        return dialog;
    }

    public static async openMoveRowDialog(dialog: Dialog, currentIndex: number, rowCount: number) {
        dialog.useTemplate({
            "currentIndex": currentIndex + 1,
            "rowCount": rowCount
        });
        dialog.setDefaultFormData({
            "newindex": currentIndex + 1
        });
        await dialog.open();
        return dialog.getPreparedDialogResult();
    }

    /*public static async postMoveRowDialog(context, currentIndex: number, rowCount: number) {
        return await context.postMessage({
            name: "dialog.moveRow",
            currentIndex,
            rowCount
        });
    }*/

    public static async createMoveColumnDialog(): Promise<Dialog> {
        let dialog = new Dialog();
        await dialog.create();
        await dialog.setButtons([{id: "move", title: "Move"}, {id: "cancel"}]);
        dialog.addPositiveIds("move");
        dialog.template = `
            <div>
                <h3>Move column</h3>
                <p>To which position do you want to move the selected column?</p>
                <p><em>The column is currently at position {currentIndex}</em></p>
                <form>
                    <p><strong>New position:</strong></p>
                    <input type="number" name="newindex" value="{currentIndex}" min="1" max="{columnCount}">
                </form>
            </div>
        `;
        dialog.setDefaultFormData({
            "newindex": 1
        });
        return dialog;
    }

    public static async openMoveColumnDialog(dialog: Dialog, currentIndex: number, columnIndex: number) {
        dialog.useTemplate({
            "currentIndex": currentIndex + 1,
            "columnIndex": columnIndex
        });
        dialog.setDefaultFormData({
            "newindex": currentIndex + 1
        });
        await dialog.open();
        return dialog.getPreparedDialogResult();
    }

    /*public static async postMoveColumnDialog(context, currentIndex: number, columnCount: number) {
        return await context.postMessage({
            name: "dialog.moveColumn",
            currentIndex,
            columnCount
        });
    }*/

    public static async createAlertDialog(): Promise<Dialog> {
        let dialog = new Dialog();
        await dialog.create();
        await dialog.setButtons([{id: "ok"}]);
        dialog.template = `
            <div>
                <h3>{title}</h3>
                <p>{text}</p>
            </div>
        `;
        return dialog;
    }

    public static async openAlertDialog(dialog: Dialog, text: string, title: string, useNativeDialog: boolean) {
        if (useNativeDialog) {
            alert(`${title}: ${text}`);
            return { id: "ok", confirm: true, formData: {} };
        }
        else {
            dialog.useTemplate({
                "text": text,
                "title": title
            });
            await dialog.open();
            return dialog.getPreparedDialogResult();
        }
    }

    /*public static async postAlertDialog(context, text: string, title: string) {
        return await context.postMessage({
            name: "alert",
            text,
            title
        });
    }*/

    public static async createConfirmDialog(): Promise<Dialog> {
        let dialog = new Dialog();
        await dialog.create();
        await dialog.setButtons([{id: "yes"}, {id: "no"}]);
        dialog.template = `
            <div>
                <h3>{title}</h3>
                <p>{text}</p>
            </div>
        `;
        return dialog;
    }

    public static async openConfirmDialog(dialog: Dialog, text: string, title: string, useNativeDialog: boolean) {
        if (useNativeDialog) {
            let result = confirm(`${title}: ${text}`);
            return { id: result ? "ok" : "cancel", confirm: result, formData: {} };
        }
        else {
            dialog.useTemplate({
                "text": text,
                "title": title
            });
            await dialog.open();
            return dialog.getPreparedDialogResult();
        }
    }

    /*public static async postConfirmDialog(context, text: string, title: string) {
        return await context.postMessage({
            name: "confirm",
            text,
            title
        });
    }*/
}