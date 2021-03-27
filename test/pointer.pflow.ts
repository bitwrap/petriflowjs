import {ModelDsl} from "../src/metamodel";

function v1(dsl: ModelDsl) {
    const { role, cell, fn } = dsl;

    const user = role("default");

    const rev = cell("revision");
    const disabled = cell("disabled", 0,  1);
    const newPointer = cell("new", 1, 1);

    const create = fn("create", user);
    newPointer.tx(1, create);
    create.tx(1, rev);

    const rm = fn("disable", user);
    rm.tx(1, disabled);
    rm.tx(1, rev);

    const enable = fn("enable", user);
    disabled.tx(1, enable);
    enable.tx(1, rev);

    const update = fn("update", user);
    disabled.guard(1, update);
    update.tx(1, rev);
}
