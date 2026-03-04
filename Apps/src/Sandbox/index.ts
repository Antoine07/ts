import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, "./");

console.log(DATA_PATH)


async function main(){
    const raw = await readFile(`${DATA_PATH}/persons.json`, "utf-8");

    const data: unknown = JSON.parse(raw);

    const Schema = z.object({
        name: z.string().min(1)
    });

    const parsed = Schema.safeParse(data);

    console.log(parsed)

    if(parsed.success) console.log(parsed.data.name)

    // data.name

}

main();