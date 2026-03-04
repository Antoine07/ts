
import { LoadInput } from "../Infrastructure/LoadInput";
import { TuringMachine } from "../Domain/TuringMachine";
import { Rule } from "../Domain/type";
import { dirname, join } from "node:path";
import { config } from "../config";
import { z } from "zod";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_PATH = join(__dirname, "../Data");

const machineInputSchema = z.object({
    name: z.string().trim().min(1, "name is required"),
    tape: z.array(z.number()).min(1, "tape must contain at least one number"),
});

// type zod 
type MachineInput = z.infer<typeof machineInputSchema>;

const doubleRule: Rule<number> = {
    transform: (n) => n * 2
}

async function main() {

    for (const file of config.machineFiles) {

        const path = join(DATA_PATH, file); // concaténation 

        try {

            const loader = new LoadInput<MachineInput>(
                path,
                machineInputSchema
            );

            const input = await loader.load(); // potentiellement des exceptions 

            const machine = new TuringMachine<number>(
                input.tape,
                doubleRule
            );

            machine.run();

            console.log(`Machine "${input.name}" processed`);
            console.log(machine.getTape());

        } catch (error) {

            console.error(`Error processing file: ${file}`);

            if (error instanceof z.ZodError) {
                console.error("Validation error:", error.issues);
            } else if (error instanceof Error) {
                console.error("Error:", error.message);
            } else {
                console.error("Unknown error:", error);
            }

            console.log("--------------");
        }
    }
}

main();


(function () {


    function add(a: number, b: number) {
        return a + b
    }



    function onDone(cb: (avg: number) => void) {
        cb("4.2");
      }

})();