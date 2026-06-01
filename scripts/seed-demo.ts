import { seedDemoData } from "../src/lib/server/demo-seed";

function main() {
  const result = seedDemoData();

  console.log(JSON.stringify(result, null, 2));
}

main();
