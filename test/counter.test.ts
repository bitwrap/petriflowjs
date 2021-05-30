import { expect } from "chai";
import {v1} from "./counter.pflow";
import {NewModel} from "../src/metamodel";
import {ErrorGuardCheckFailure} from "../src/metamodel";

describe("counter", () => {

    it("should enforce guard rules", () => {
        const m = NewModel("counter", v1);
        expect(m.schema).eqls("counter");
        let state = m.initialState();
        let out = m.emptyVector();
        let role: string;

        const txn = (action: string, mult?: number): Error|void => {
            const [error, out, role] = m.transform(state, action, mult || 1);
            if (error) {
                throw error;
            } else {
                state = out;
                //console.log(state);
            }
        };

        //console.log(state);
        txn("inc0");
        txn("inc0");

        expect(() => txn("dec0",1)).to.throw(ErrorGuardCheckFailure);

        expect(state).to.eql([2,1,1]);

        txn("clearFlag", 1);
        txn("dec0", 1);

        expect(state).to.eql([1,1,0]);
    });

});

