/**
 * Bloom Grid Tabulator Library
 * A TypeScript library for creating beautiful data grids
 */

export interface GridOptions {
  columns: Column[];
  data: any[];
  height?: string | number;
  pagination?: boolean;
  pageSize?: number;
}

export interface Column {
  field: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export class BloomGridTabulator {
  private options: GridOptions;
  private container: HTMLElement;

  constructor(container: HTMLElement | string, options: GridOptions) {
    this.container =
      typeof container === "string"
        ? (document.querySelector(container) as HTMLElement)
        : container;

    if (!this.container) {
      throw new Error("Container element not found");
    }

    this.options = options;
    this.init();
  }

  private init(): void {
    this.render();
  }

  private render(): void {
    // Basic implementation - you can expand this
    this.container.innerHTML = `
      <div class="bloom-grid">
        <table>
          <thead>
            <tr>
              ${this.options.columns
                .map((col) => `<th>${col.title}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${this.options.data
              .map(
                (row) =>
                  `<tr>${this.options.columns
                    .map((col) => `<td>${row[col.field] || ""}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  public updateData(data: any[]): void {
    this.options.data = data;
    this.render();
  }
  public destroy(): void {
    this.container.innerHTML = "";
  }
}
