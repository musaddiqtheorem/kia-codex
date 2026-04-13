import { env } from './env';

type DuckConnection = {
  run?: (sql: string) => Promise<unknown>;
  query?: (sql: string) => Promise<unknown>;
  all?: (sql: string) => Promise<unknown[]>;
  runAndReadAll?: (sql: string) => Promise<{
    getRowsJson?: () => unknown[];
    getRows?: () => unknown[];
  }>;
};

let connectionPromise: Promise<DuckConnection> | null = null;
let serial = Promise.resolve();

const withSerial = async <T>(fn: () => Promise<T>) => {
  const run = serial.then(fn, fn);
  serial = run.then(() => undefined, () => undefined);
  return run;
};

const getConnection = async (): Promise<DuckConnection> => {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const duckdb: any = await import('@duckdb/node-api');
      const instance = await duckdb.DatabaseInstance.create(env.DUCKDB_PATH);
      return instance.connect();
    })();
  }

  return connectionPromise;
};

export const runQuery = async <T = Record<string, unknown>>(sql: string): Promise<T[]> =>
  withSerial(async () => {
    const connection = await getConnection();

    if (connection.runAndReadAll) {
      const reader = await connection.runAndReadAll(sql);
      if (reader.getRowsJson) {
        return reader.getRowsJson() as T[];
      }
      if (reader.getRows) {
        return reader.getRows() as T[];
      }
    }

    if (connection.all) {
      return (await connection.all(sql)) as T[];
    }

    if (connection.query) {
      const rows = await connection.query(sql);
      return Array.isArray(rows) ? (rows as T[]) : [];
    }

    throw new Error('No compatible query method found on DuckDB connection.');
  });

export const runExec = async (sql: string): Promise<void> =>
  withSerial(async () => {
    const connection = await getConnection();

    if (connection.run) {
      await connection.run(sql);
      return;
    }

    if (connection.query) {
      await connection.query(sql);
      return;
    }

    if (connection.runAndReadAll) {
      await connection.runAndReadAll(sql);
      return;
    }

    throw new Error('No compatible execution method found on DuckDB connection.');
  });
