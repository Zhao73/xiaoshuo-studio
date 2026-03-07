import { afterEach } from "vitest";

afterEach(() => {
  delete process.env.XIAOSHUO_HOME;
});
