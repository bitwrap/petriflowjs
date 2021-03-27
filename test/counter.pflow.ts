import {ModelDsl} from "../src/metamodel";

export function v1(dsl: ModelDsl) {
    const { role, cell, fn} = dsl;

    const user = role("default");

    const dec0 = fn("dec0", user);
    const dec1 = fn("dec1", user);

    const p00 = cell("P0", 0, 0).tx(1, dec0);
    const p01 = cell("P1", 1, 0).tx(1, dec1);

    fn("inc0", user).tx(1, p00);
    fn("inc1", user).tx(1, p01);
}
