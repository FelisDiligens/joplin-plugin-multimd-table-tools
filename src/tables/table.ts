export enum TextAlignment {
    left = "left",
    center = "center",
    right = "right",
    default = "start"
}

export enum TableCellMerge {
    above,
    left,
    none
}

export enum TableCaptionPosition {
    top = "top",
    bottom = "bottom"
}

export class IndexOutOfBoundsError extends Error {
    constructor(msg: string) {
        super(msg);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, IndexOutOfBoundsError.prototype);
    }
}

export class TableCaption {
    public constructor(
        public text = "",
        public label = "",
        public position = TableCaptionPosition.top) { }

    public getLabel(): string {
        // "If you have a caption, you can also have a label, allowing you to create anchors pointing to the table. If there is no label, then the caption acts as the label"
        if (typeof this.label === 'string' && this.label.trim() !== "")
            return this.label.trim().replace(/\s/g, "-");
        return this.text.trim().toLowerCase().replace(/\s/g, "-").replace(/[^a-zA-Z0-9]/g, "");
    }
}

export class TableCell {
    public text: string;
    public table: Table;
    public row: TableRow;
    public column: TableColumn;
    public merged: TableCellMerge;

    public constructor(table: Table, row: TableRow, column: TableColumn) {
        this.text = "";
        this.table = table;
        this.row = row;
        this.column = column;
        this.merged = TableCellMerge.none;
    }

    public isHeaderCell(): boolean {
        return this.row.isHeader;
    }

    public getTextAlignment(): TextAlignment {
        return this.column.textAlign;
    }

    public setText(text: string) {
        this.text = text;
    }

    public getColspan(): number {
        if (this.merged != TableCellMerge.left) {
            let col = this.table.indexOfColumn(this.column) + 1;
            if (col > this.table.columnCount())
                return 1;

            let colspan = 1;
            let cells = this.table.getCellsInRow(this.row);
            for (; col < this.table.columnCount(); col++) {
                if (cells[col].merged == TableCellMerge.left)
                    colspan++;
                else
                    break;
            }
            return colspan;
        }
        return 1;
    }

    public getRowspan(): number {
        if (this.merged != TableCellMerge.above) {
            let row = this.table.indexOfRow(this.row) + 1;
            if (row > this.table.rowCount())
                return 1;

            let rowspan = 1;
            let cells = this.table.getCellsInColumn(this.column);
            for (; row < this.table.rowCount(); row++) {
                if (cells[row].merged == TableCellMerge.above)
                    rowspan++;
                else
                    break;
            }
            return rowspan;
        }
        return 1;
    }
}

export class TableRow {
    public cells: TableCell[];

    public constructor(
        public index: number = 0,
        public isHeader: boolean = false,
        public startsNewSection: boolean = false) {
        this.cells = [];
    }

    public updateCells(table: Table) {
        if (table.columnCount() != this.cells.length)
            this.cells = table.getCells().filter(cell => cell.row == this);
        this.cells = this.cells.sort((a, b) => a.column.index - b.column.index);
    }
    
    public getCell(index: number): TableCell {
        return this.cells[index];
    }
    
    public getCells(): TableCell[] {
        return this.cells;
    }
}

export class TableColumn {
    public cells: TableCell[];

    public constructor(
        public index: number = 0,
        public textAlign: TextAlignment = TextAlignment.default,
        public wrappable: boolean = false) {
        this.cells = [];
    }

    public updateCells(table: Table) {
        if (table.rowCount() != this.cells.length)
            this.cells = table.getCells().filter(cell => cell.column == this);
        this.cells = this.cells.sort((a, b) => a.row.index - b.row.index);
    }
    
    public getCell(index: number): TableCell {
        return this.cells[index];
    }
    
    public getCells(): TableCell[] {
        return this.cells;
    }
}

export class Table {
    private cells: TableCell[];
    private rows: TableRow[];
    private columns: TableColumn[];
    public caption: TableCaption;

    /** Text before the table */
    public beforeTable: string;

    /** Text after the table */
    public afterTable: string;

    public constructor(rowNum: number = 0, colNum: number = 0) {
        this.cells = [];
        this.rows = Array.from({length: rowNum}, (_, i: number) => new TableRow(i));
        this.columns = Array.from({length: colNum}, (_, i: number) => new TableColumn(i));
        this.caption = null;
        this.beforeTable = "";
        this.afterTable = "";
    }

    /**
     * Adds a TableRow to the table.
     * @param index Insert row at index. -1 means it's appended.
     * @param row (optional)
     * @returns The added row.
     */
    public addRow(index: number = -1, row: TableRow = new TableRow()): TableRow {
        if (index < 0) {
            row.index = this.rows.push(row) - 1;
        } else {
            row.index = index;
            this.rows.splice(index, 0, row);
        }
        return row;
    }

    /**
     * Adds a TableColumn to the table.
     * @param index Insert column at index. -1 means it's appended.
     * @param col (optional)
     * @returns The added column.
     */
    public addColumn(index: number = -1, col: TableColumn = new TableColumn()): TableColumn {
        if (index < 0) {
            col.index = this.columns.push(col);
        } else {
            col.index = index;
            this.columns.splice(index, 0, col);
        }
        return col;
    }

    /** Gets the row at index. Negative index counts back from the end. Returns undefined if out-of-bounds. */
    public getRow(index: number): TableRow {
        return this.rows[index];
    }

    /** Gets the index of the row. -1 if it hasn't been found. */
    public indexOfRow(row: TableRow): number {
        return this.rows.indexOf(row);
    }

    /** Gets the column at index. Negative index counts back from the end. Returns undefined if out-of-bounds. */
    public getColumn(index: number): TableColumn {
        return this.columns[index];
    }

    /** Gets the index of the column. -1 if it hasn't been found. */
    public indexOfColumn(col: TableColumn): number {
        return this.columns.indexOf(col);
    }

    /**
     * Removes the given column. Also removes all cells within the column. 
     * @param col Either index or object reference.
    */
    public removeColumn(col: number | TableColumn) {
        let colObj = typeof col === "number" ? this.columns[col] : col;
        let columnCells = this.getCellsInColumn(colObj);
        this.cells = this.cells.filter(cell => !columnCells.includes(cell));
        this.columns = this.columns.filter(c => c != colObj);
    }

    /**
     * Removes the given row. Also removes all cells within the row.
     * @param row Either index or object reference.
     */
    public removeRow(row: number | TableRow) {
        let rowObj = typeof row === "number" ? this.rows[row] : row;
        let rowCells = this.getCellsInRow(rowObj);
        this.cells = this.cells.filter(cell => !rowCells.includes(cell));
        this.rows = this.rows.filter(r => r != rowObj);
    }

    /**
     * Moves the given column to the new index.
     * @param col Either index or object reference.
     * @param newIndex The new index of the given column.
     * @throws {IndexOutOfBoundsError} Can't move column outside of table.
     */
    public moveColumn(col: number | TableColumn, newIndex: number) {
        let colObj = typeof col === "number" ? this.columns[col] : col;
        if (colObj === undefined || newIndex >= this.columnCount() || newIndex < 0)
            throw new IndexOutOfBoundsError("(IndexOutOfBoundsError) Can't move column outside of table.");
        this.columns.splice(colObj.index, 1);
        this.columns.splice(newIndex, 0, colObj);
        colObj.index = newIndex;
    }

    /**
     * Moves the given row to the new index.
     * @param col Either index or object reference.
     * @param newIndex The new index of the given row.
     * @throws {IndexOutOfBoundsError} Can't move row outside of table.
     */
    public moveRow(row: number | TableRow, newIndex: number) {
        let rowObj = typeof row === "number" ? this.rows[row] : row;
        if (rowObj === undefined || newIndex >= this.rowCount() || newIndex < 0)
            throw new IndexOutOfBoundsError("(IndexOutOfBoundsError) Can't move row outside of table.");
        this.rows.splice(rowObj.index, 1);
        this.rows.splice(newIndex, 0, rowObj);
        rowObj.index = newIndex;
    }

    /** Returns a list of all rows that are headers. */
    public getHeaderRows(): TableRow[] {
        return this.rows.filter(r => r.isHeader);
    }

    /** Returns a list of all rows that aren't headers. */
    public getNormalRows(): TableRow[] {
        return this.rows.filter(r => !r.isHeader);
    }

    /** Retruns all rows in the table, from top to bottom, including header rows. */
    public getRows(): TableRow[] {
        return this.rows;
    }

    /** Returns all columns in the table, from left to right. */
    public getColumns(): TableColumn[] {
        return this.columns;
    }

    /** Returns all cells in the table. Isn't necessarily sorted! */
    public getCells(): TableCell[] {
        return this.cells;
    }

    /**
     * Returns all cells within the given row.
     * See also: {@link TableRow.getCells()}
     * @param row Either index or object reference.
     */
    public getCellsInRow(row: number | TableRow): TableCell[] {
        return (typeof row === "number" ? this.rows[row] : row).cells;
    }

    /**
     * Returns all cells within the given column.
     * See also: {@link TableColumn.getCells()}
     * @param column Either index or object reference.
     */
    public getCellsInColumn(column: number | TableColumn): TableCell[] {
        return (typeof column === "number" ? this.columns[column] : column).cells;
    }

    /** Returns the cell at row and column. */
    private getCellByObjs(rowObj: TableRow, columnObj: TableColumn): TableCell {
        // Intersection of row / column:
        for (const cell of rowObj.cells) {
            if (columnObj.cells.includes(cell))
                return cell;
        }

        let newCell = new TableCell(this, rowObj, columnObj);
        this.addCell(newCell);
        return newCell;
    }

    /**
     * Returns the cell at row and column.
     * If the cell doesn't already exist, it will be created.
     * @param row Either index or object reference.
     * @param column Either index or object reference.
     * @returns The cell at row and column.
     */
    public getCell(row: number | TableRow, column: number | TableColumn): TableCell {
        return this.getCellByObjs(
            typeof row === "number" ? this.rows[row] : row,
            typeof column === "number" ? this.columns[column] : column
        );
    }

    /**
     * Adds the cell to the Table and the cell's respective TableRow and TableColumn.
     * (Be careful not to add a cell with row/column that already exist. Otherwise, the added cell will be overshadowed and not be used.)
     */
    public addCell(cell: TableCell) {
        this.cells.push(cell);
        cell.row.cells.push(cell);
        cell.column.cells.push(cell);
    }

    /** Returns the total amount of rows in the table, including the header rows. */
    public rowCount(): number {
        return this.rows.length;
    }

    /** Returns the total amount of columns in the table. */
    public columnCount(): number {
        return this.columns.length;
    }

    /**
     * -> Ensures that all table cells exist.
     * -> Updates indices and sorts the cells within rows and columns.
     * -> Tries to find invalid configurations and sanitize them.
     * 
     * Use this when altering the table.
     */
    public update(): Table {
        // Iterate over the entire table:
        let columnObj: TableColumn;
        let rowObj: TableRow;
        for (let colIndex = 0; colIndex < this.columns.length; colIndex++) {
            // Update the column's index:
            columnObj = this.columns[colIndex];
            columnObj.index = colIndex;

            for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
                // Update the row's index:
                rowObj = this.rows[rowIndex];
                rowObj.index = rowIndex;

                // Use "getCellByObjs" to ensure that the cell gets created, if it doesn't exist already:
                this.getCellByObjs(rowObj, columnObj);
            }
        }

        // Update the column's 'cells' array:
        for (const column of this.columns)
            column.updateCells(this);

        // Update the row's 'cells' array:
        for (const row of this.rows)
            row.updateCells(this);

        this.sanitize();
        return this;
    }

    /** Tries to find invalid configurations and sanitize them. */
    private sanitize(): Table {
        if (this.getNormalRows().length > 0) {
            // Cannot merge cell above if in first row:
            for (const cell of this.getCellsInRow(this.getNormalRows()[0])) {
                if (cell.merged == TableCellMerge.above)
                    cell.merged = TableCellMerge.none;
            }
    
            this.getNormalRows()[0].startsNewSection = false;
        }

        for (const cell of this.cells) {
            // Cannot merge cell left if in first column:
            if (cell.column == this.columns[0] && cell.merged == TableCellMerge.left)
                cell.merged = TableCellMerge.none;

            // Cannot merge cell above if in first row:
            if ((cell.row == this.rows[0] || cell.row.startsNewSection) && cell.merged == TableCellMerge.above)
                cell.merged = TableCellMerge.none;
        }
        
        return this;
    }
}

