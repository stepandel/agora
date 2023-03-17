import { promises as fs } from "fs";

import { LevelEntityStore } from "../storage/level/levelEntityStore";

async function main() {
  const entityStore = await LevelEntityStore.open();
  const logFile = await fs.open("data/dump/Nouns.jsonl", "w");

  for await (const entity of entityStore.getEntities()) {
    await logFile.write(JSON.stringify(entity) + "\n");
  }

  await logFile.close();
}

main();
