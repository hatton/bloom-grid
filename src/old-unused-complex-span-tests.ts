// Comprehensive span handling tests
describe("Span handling during column/row removal", () => {
  it("removeColumnAt: cell starting at removed column with span>1 reduces span", () => {
    const grid = newGrid();
    addColumn(grid); // 3x2 grid

    // Cell at (0,1) spans 2 columns (covers columns 1-2)
    const cell = getCell(grid, 0, 1);
    cell.id = "spanning-cell";
    setCellSpan(cell, 2, 1);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
    expect(originalSpan).toBe(2);

    // Remove column 1 (the starting column of the span)
    removeColumnAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-x")) || 1;
    expect(newSpan).toBe(1);
  });

  it("removeColumnAt: cell starting at removed column with span=1 is removed", () => {
    const grid = newGrid();
    addColumn(grid); // 3x2 grid

    // Cell at (0,1) with no span (span=1)
    const cell = getCell(grid, 0, 1);
    cell.id = "single-cell";

    const originalCellCount = getGridInfo(grid).cellCount;
    expect(document.getElementById("single-cell")).toBeTruthy();

    // Remove column 1
    removeColumnAt(grid, 1);

    // Cell should be removed
    expect(document.getElementById("single-cell")).toBeNull();
    const newCellCount = getGridInfo(grid).cellCount;
    expect(newCellCount).toBe(originalCellCount - 2); // 2 cells removed (one from each row)
  });

  it("removeColumnAt: cell spanning across removed column reduces span", () => {
    const grid = newGrid();
    addColumn(grid);
    addColumn(grid); // 4x2 grid

    // Cell at (0,0) spans 3 columns (covers columns 0-2)
    const cell = getCell(grid, 0, 0);
    cell.id = "wide-spanning-cell";
    setCellSpan(cell, 3, 1);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
    expect(originalSpan).toBe(3);

    // Remove column 1 (middle of the span)
    removeColumnAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("wide-spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-x")) || 1;
    expect(newSpan).toBe(2); // Reduced from 3 to 2
  });

  it("removeRowAt: cell starting at removed row with span>1 reduces span", () => {
    const grid = newGrid();
    addRow(grid); // 2x3 grid

    // Cell at (1,0) spans 2 rows (covers rows 1-2)
    const cell = getCell(grid, 1, 0);
    cell.id = "tall-spanning-cell";
    setCellSpan(cell, 1, 2);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-y")) || 1;
    expect(originalSpan).toBe(2);

    // Remove row 1 (the starting row of the span)
    removeRowAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("tall-spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-y")) || 1;
    expect(newSpan).toBe(1);
  });

  it("removeRowAt: cell starting at removed row with span=1 is removed", () => {
    const grid = newGrid();
    addRow(grid); // 2x3 grid

    // Cell at (1,0) with no span (span=1)
    const cell = getCell(grid, 1, 0);
    cell.id = "single-row-cell";

    const originalCellCount = getGridInfo(grid).cellCount;
    expect(document.getElementById("single-row-cell")).toBeTruthy();

    // Remove row 1
    removeRowAt(grid, 1);

    // Cell should be removed
    expect(document.getElementById("single-row-cell")).toBeNull();
    const newCellCount = getGridInfo(grid).cellCount;
    expect(newCellCount).toBe(originalCellCount - 2); // 2 cells removed (one from each column)
  });

  it("removeRowAt: cell spanning across removed row reduces span", () => {
    const grid = newGrid();
    addRow(grid);
    addRow(grid); // 2x4 grid

    // Cell at (0,0) spans 3 rows (covers rows 0-2)
    const cell = getCell(grid, 0, 0);
    cell.id = "tall-wide-spanning-cell";
    setCellSpan(cell, 1, 3);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-y")) || 1;
    expect(originalSpan).toBe(3);

    // Remove row 1 (middle of the span)
    removeRowAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("tall-wide-spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-y")) || 1;
    expect(newSpan).toBe(2); // Reduced from 3 to 2
  });

  it("removeColumnAt: multiple cells with different span behaviors", () => {
    const grid = newGrid();
    addColumn(grid);
    addColumn(grid);
    addColumn(grid); // 5x2 grid

    // Set up various cells with different spans
    const cell00 = getCell(grid, 0, 0);
    cell00.id = "cell-00";
    setCellSpan(cell00, 2, 1); // Spans columns 0-1

    const cell02 = getCell(grid, 0, 2);
    cell02.id = "cell-02";
    // This cell has span=1, starts at column 2

    const cell03 = getCell(grid, 0, 3);
    cell03.id = "cell-03";
    setCellSpan(cell03, 2, 1); // Spans columns 3-4

    const cell10 = getCell(grid, 1, 0);
    cell10.id = "cell-10";
    setCellSpan(cell10, 3, 1); // Spans columns 0-2

    // Remove column 2
    removeColumnAt(grid, 2);

    // Check results:
    // cell00 (spans 0-1): should be unaffected
    expect(document.getElementById("cell-00")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-00")!.style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);

    // cell02 (single cell at column 2): should be removed
    expect(document.getElementById("cell-02")).toBeNull();

    // cell03 (spans 3-4, now 2-3): should be unaffected
    expect(document.getElementById("cell-03")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-03")!.style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);

    // cell10 (spans 0-2): should have span reduced from 3 to 2
    expect(document.getElementById("cell-10")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-10")!.style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);
  });

  it("removeRowAt: multiple cells with different span behaviors", () => {
    const grid = newGrid();
    addRow(grid);
    addRow(grid);
    addRow(grid); // 2x5 grid

    // Set up various cells with different spans
    const cell00 = getCell(grid, 0, 0);
    cell00.id = "cell-00";
    setCellSpan(cell00, 1, 2); // Spans rows 0-1

    const cell20 = getCell(grid, 2, 0);
    cell20.id = "cell-20";
    // This cell has span=1, starts at row 2

    const cell30 = getCell(grid, 3, 0);
    cell30.id = "cell-30";
    setCellSpan(cell30, 1, 2); // Spans rows 3-4

    const cell01 = getCell(grid, 0, 1);
    cell01.id = "cell-01";
    setCellSpan(cell01, 1, 3); // Spans rows 0-2

    // Remove row 2
    removeRowAt(grid, 2);

    // Check results:
    // cell00 (spans 0-1): should be unaffected
    expect(document.getElementById("cell-00")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-00")!.style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);

    // cell20 (single cell at row 2): should be removed
    expect(document.getElementById("cell-20")).toBeNull();

    // cell30 (spans 3-4, now 2-3): should be unaffected
    expect(document.getElementById("cell-30")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-30")!.style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);

    // cell01 (spans 0-2): should have span reduced from 3 to 2
    expect(document.getElementById("cell-01")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-01")!.style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);
  });
});
