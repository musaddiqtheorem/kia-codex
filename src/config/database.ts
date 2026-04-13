import duckdb from 'duckdb';
import { env } from './env';

const db = new duckdb.Database(env.DUCKDB_PATH);

export const runQuery = <T = unknown>(sql: string): Promise<T[]> =>
  new Promise((resolve, reject) => {
    db.all(sql, (err: Error | null, rows: T[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

export const runExec = (sql: string): Promise<void> =>
  new Promise((resolve, reject) => {
    db.exec(sql, (err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
