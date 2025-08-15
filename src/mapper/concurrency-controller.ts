export class ConcurrencyController {
  static async executeWithLimitedConcurrency<T>(
    tasks: T[],
    processor: (task: T) => Promise<void>,
    limit: number,
  ): Promise<void> {
    if (limit <= 0) {
      await Promise.all(tasks.map((task) => processor(task)));
      return;
    }

    const executing = new Set<Promise<void>>();

    for (const task of tasks) {
      const promise = processor(task).finally(() => {
        executing.delete(promise);
      });

      executing.add(promise);

      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }
}
