// Loads the seed player pool from players.csv, so the roster can be edited
// in a spreadsheet (Excel, Google Sheets, etc.) instead of hand-editing a
// TypeScript array. Re-run `npm run prisma:seed` after editing the CSV.
//
// CSV columns: name,nationality,positions,overall,pace,shooting,passing,dribbling,defending,physical
// `positions` supports multiple values separated by "|", e.g. "CM|CDM".
//
// Names, nationalities, and positions are public facts. The numeric ratings
// are our own rough approximations, not copied from any official game or
// ratings database.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

export type SeedPlayer = {
  name: string;
  nationality: string;
  positions: string[];
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

const CSV_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "players.csv");

const NUMERIC_COLUMNS = [
  "overall",
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
] as const;

function parseCsv(content: string): SeedPlayer[] {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const [headerLine, ...rows] = lines;
  const columns = headerLine.split(",");

  return rows.map((line, rowIndex) => {
    const cells = line.split(",");
    if (cells.length !== columns.length) {
      throw new Error(`players.csv row ${rowIndex + 2} has ${cells.length} columns, expected ${columns.length}`);
    }

    const record: Record<string, string> = {};
    columns.forEach((col, i) => {
      record[col.trim()] = cells[i].trim();
    });

    const player = {
      name: record.name,
      nationality: record.nationality,
      positions: record.positions.split("|"),
    } as SeedPlayer;

    for (const col of NUMERIC_COLUMNS) {
      const value = Number(record[col]);
      if (!Number.isFinite(value)) {
        throw new Error(`players.csv row ${rowIndex + 2}: invalid ${col} value "${record[col]}" for ${record.name}`);
      }
      player[col] = value;
    }

    return player;
  });
}

export const PLAYERS: SeedPlayer[] = parseCsv(readFileSync(CSV_PATH, "utf8"));
