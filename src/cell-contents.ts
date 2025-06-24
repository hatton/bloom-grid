// The users of the library decide what contents are possible in a cell, and what the default content is when a cell is created.
// This file defines the default cell contents and provides a way to customize them.

import { CellContentType } from "./types";

export function contentTypeOptions(): { id: string; englishName: string }[] {
  return defaultCellContentsForEachType.map((content) => ({
    id: content.id,
    englishName: content.englishName,
  }));
}
export const defaultCellContentsForEachType: CellContentType[] = [
  {
    id: "text",
    englishName: "Text",
    // About the "_": I couldn't get the the browser to honor the contenteditable at runtime if it was empty.
    templateHtml: "<div contenteditable='true'>_</div>",
    regexToIdentify: /<div[^>]*contenteditable=['"]true['"][^>]*>/,
  },
  {
    id: "grid",
    englishName: "Grid",
    templateHtml: `<div class='grid' data-column-widths='fill,fill' data-row-heights='fill,fill'>
            <div class='cell' data-content-type='text'></div>
            <div class='cell' data-content-type='text'></div>
            <div class='cell' data-content-type='text'></div>
            <div class='cell' data-content-type='text'></div>
        </div>`,
    regexToIdentify: /<div[^>]*class=['"][^'"]*grid[^'"]*['"][^>]*>/,
  },
  {
    id: "image",
    englishName: "Image",
    templateHtml: `<img src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Green_parrot_on_branch_with_yellow_head.svg/195px-Green_parrot_on_branch_with_yellow_head.svg.png' alt='Placeholder Image' />`,
    regexToIdentify: /<img/,
  },
];

let defaultCellContentTypeId: string = "text";

export function getCurrentContentTypeId(cell: HTMLElement): string | undefined {
  return (
    cell.dataset.contentType /* use regex to identify */ ||
    defaultCellContentsForEachType.find((c) =>
      c.regexToIdentify.test(cell.innerHTML)
    )?.id ||
    defaultCellContentTypeId
  );
}
export function setupContentsOfCell(
  cell: HTMLElement,
  targetType?: string
): HTMLElement | null {
  // First we figure out what is already there in the cell.
  let existingContentType = cell.dataset.contentType;
  if (existingContentType === undefined && cell.children.length > 0) {
    // see if we can identify the content type from the cell's contents
    const content = defaultCellContentsForEachType.find((c) =>
      c.regexToIdentify.test(cell.innerHTML)
    );
    if (content) {
      existingContentType = content.id; // if we found a match, use that as the existing content type
      cell.dataset.contentType = content.id; // add the attribute that was missing
    }
  }

  // if we were not given a content type to switch to and the cell is empty, fill it with the default content type
  if (!targetType && !existingContentType) {
    targetType = defaultCellContentTypeId;
  }
  // if we still don't have a target type, then we can't do anything with the cell.
  if (!targetType) {
    return (cell.firstChild as HTMLElement) || null;
  }

  // if the existing content type matches the requested one, do nothing
  if (existingContentType === targetType) {
    return (cell.firstChild as HTMLElement) || null;
  }

  const content = defaultCellContentsForEachType.find(
    (c) => c.id === targetType
  );
  if (!content) {
    throw new Error(
      `Unknown content type: ${targetType}. Available types are: ${defaultCellContentsForEachType
        .map((c) => c.id)
        .join(", ")}`
    );
  }

  cell.dataset.contentType = targetType;
  cell.innerHTML = content.templateHtml;

  // if we just inserted a grid, set each of its cells to the default content type
  if (targetType === "grid") {
    const gridCells = cell.querySelectorAll<HTMLElement>(".cell");
    gridCells.forEach((gridCell) => {
      gridCell.dataset.contentType = defaultCellContentTypeId;

      gridCell.innerHTML =
        defaultCellContentsForEachType.find(
          (c) => c.id === defaultCellContentTypeId
        )?.templateHtml || "!!!";
    });
  }

  // up until this point, we don't know if the contents fit our rule that there must be only one root element to the contents
  // so we check that now
  if (cell.children.length !== 1) {
    throw new Error(
      `Cell contents must have exactly one root element, but found ${cell.children.length} elements.`
    );
  }
  // for testing purposes, return the child
  return (cell.firstChild as HTMLElement) || null;
}
