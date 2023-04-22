import { StoredEntry } from "../storage/dump";
import { loadJsonLines } from "../../utils/jsonLines";

export async function* loadExportFile() {
  yield* loadJsonLines<StoredEntry>("data/dump/Nouns.jsonl");
}
