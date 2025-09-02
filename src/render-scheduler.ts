type Task = { grid: HTMLElement; reason?: string };

const pending = new Map<HTMLElement, number>(); // grid -> timeoutId
const queue = new Map<HTMLElement, Task>();

export interface RequestOptions {
  immediate?: boolean; // run synchronously (for tests)
  raf?: boolean; // prefer requestAnimationFrame over setTimeout/microtask
}

// Allow injecting a renderer for testing
export type RendererFn = (grid: HTMLElement, reason?: string) => void;
let renderer: RendererFn | null = null;

export function setRenderer(fn: RendererFn) {
  renderer = fn;
}

function flush(grid: HTMLElement) {
  const task = queue.get(grid);
  if (!task) return;
  queue.delete(grid);
  pending.delete(grid);
  renderer?.(task.grid, task.reason);
}

export function request(
  grid: HTMLElement,
  reason?: string,
  options?: RequestOptions
) {
  // coalesce by grid
  queue.set(grid, { grid, reason });

  if (options?.immediate) {
    flush(grid);
    return;
  }

  // Only schedule if not already pending
  if (pending.has(grid)) return;

  const schedule = () => {
    const id = setTimeout(() => flush(grid), 0) as unknown as number;
    pending.set(grid, id);
  };

  if (options?.raf && typeof requestAnimationFrame !== "undefined") {
    const id = requestAnimationFrame(() => flush(grid)) as unknown as number;
    pending.set(grid, id);
  } else {
    schedule();
  }
}

export function cancel(grid: HTMLElement) {
  const id = pending.get(grid);
  if (id != null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (clearTimeout as any)(id);
      // also try cancelAnimationFrame in case we used RAF
      if (typeof cancelAnimationFrame !== "undefined") {
        try {
          cancelAnimationFrame(id as unknown as number);
        } catch {}
      }
    } catch {}
  }
  pending.delete(grid);
  queue.delete(grid);
}
