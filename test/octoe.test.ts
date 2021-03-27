import { expect } from "chai";
import { Octoe} from "./octoe";
import {ErrorInvalidOutput} from "../src/statemachine";
import {Move, Player} from "./octoe.pflow";

describe("Octoe", () => {

    it("should be able to play tic-tac-toe", () => {
        const game = new Octoe();
        expect(game.isTurnO()).to.be.false;
        expect(game.isTurnX()).to.be.true;
        expect(game.isOver()).to.be.false;
        expect(game.availableMoves(Player.X)).to.include("x11");

        const [err1, out1, role1] = game.move("x11");
        expect(err1).to.be.null;
        expect(out1).to.eql([1,1,1,1,0,1,1,1,1,0,1]);
        expect(role1).to.eql(Player.X);

        expect(game.availableMoves(Player.O)).not.to.include(Player.O+Move._11);
        expect(game.availableMoves(Player.O)).to.include("o01");

        const res = game.move("x11");
        expect(res[0]).to.eql(ErrorInvalidOutput);

        expect(game.hasWinner()[0]).to.be.false;

        // finish the game
        game.move("o20");
        game.move("x00");
        game.move("o21");
        game.move("x22"); // X wins

        expect(game.isOver()).to.be.true;
        expect(game.hasWinner()[1]).to.eql(Player.X);
    });

    // doing this for 100% test coverage
    it("O should be able to win (if x is a poor player :-P )", () => {
        const game = new Octoe();
        const play = (m: string) => {
            const res = game.move(m);
            if (res[0] != null) {
                throw res[0];
            }
        };

        play("x01");
        play("o11");
        play("x02");
        play("o00");
        play("x20");
        expect(game.hasWinner()[1]).to.be.null;
        expect(game.isOver()).to.be.false;
        play("o22");
        expect(game.hasWinner()[1]).to.eql(Player.O);
    });

    it("should allow user to provide input state", () => {
        const g = new Octoe();
        const inState = g.initialState();
        inState[g.offset("11")] = 0; // remove middle space
        const game = new Octoe(inState);
        expect(game.availableMoves(Player.X)).to.include("x00");
        expect(game.availableMoves(Player.X)).to.not.include("x11");
    });

    it("should allow lookup action offset", () => {
        const g = new Octoe();
        expect(g.actionId("x00")).eqls(0);
        expect(g.actionId("x11")).eqls(4);
        expect(g.actionId("o22")).eqls(17);
    });

});

