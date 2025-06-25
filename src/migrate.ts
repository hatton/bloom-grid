export function migrateGrid(gridDiv: HTMLElement): void {
  if (!gridDiv) throw new Error("Grid element is required");

  // make sure that every div.cell that has a first child that is a div.grid
  // is selectable by setting its tabindex to -1
  const cells = gridDiv.querySelectorAll("div.cell");
  cells.forEach((cell) => {
    const firstChild = cell.firstElementChild;
    if (firstChild && firstChild.classList.contains("grid")) {
      cell.setAttribute("tabindex", "-1");
    }
  });
}
