import {Move, Player, Turn, v1} from "./octoe.pflow";
import {Model, NewModel} from "../src/metamodel";

/**
 * game.ledger record type
 */
type Event = {
    role: string;
    moved: string;
}

/**
 * Test returns true if setA contains setB
 * @param setA
 * @param setB
 */
function contains(setA: Set<string>, setB: Set<string>): boolean {
    for (const el of setB) {
        if (! setA.has(el)) {
            return false;
        }
    }
    return true;
}

/**
 * Play a game of tic-tac-toe using a Petri-net model
 */
export class Octoe {
    model: Model = NewModel("octoe", v1);
    state: Array<number>
    ledger: Array<Event>

    winningMoves: Array<Set<string>> = [
        new Set<string>([Move._00, Move._11, Move._22]),
        new Set<string>([Move._02, Move._11, Move._20]),
        new Set<string>([Move._00, Move._01, Move._02]),
        new Set<string>([Move._10, Move._11, Move._12]),
        new Set<string>([Move._20, Move._21, Move._22]),
    ]

    constructor(state?: Array<number>) {
        this.ledger = new Array<Event>();
        if (state) {
            this.state = state;
        } else {
            this.state = this.model.initialState();
        }
    }

    /**
     * Check for O turn
     */
    isTurnO (): boolean {
        return this.state[this.model.offset(Turn.O)] == 1;
    }

    /**
     * Check for X turn
     */
    isTurnX (): boolean {
        return this.state[this.model.offset(Turn.X)] == 1;
    }

    /**
     * move - performs a state transformation and keep a record.
     *
     * A given model's labels can be thought of as an internal DSL specific to this program.
     * @param action
     */
    move(action: string): [Error, Array<number>, string] {
        const [err, out, role] = this.model.transform(this.state, action, 1);
        if (!err) {
            this.state = out;
            const moved = action.substr(1);
            this.ledger.push({ role: role.label, moved });
        }
        return [err, out, role.label];
    }

    /**
     * list valid moves for game state
     * @param role filter by authorized roles
     */
    availableMoves(role: string): Array<string> {
        const moves = new Array<string>();
        for (const action of this.model.actions()) {
            const [err, out, requireRole] = this.model.transform(this.state, action, 1);
            if (out && !err && role == requireRole.label) {
                moves.push(action);
            }
        }
        return moves;
    }

    /**
     * Detect if game ledger contains a winning configuration
     */
    hasWinner(): [boolean, string] {
        // game cannot end before move 5
        if (this.ledger.length < 5) {
            return [false, null];
        }
        const setX = new Set<string>();
        const setO = new Set<string>();

        this.ledger.forEach((evt) => {
            if (evt.role == Player.X) {
                setX.add(evt.moved);
            }
            if (evt.role == Player.O) {
                setO.add(evt.moved);
            }
        });

        for (const winSet of this.winningMoves) {
            // REVIEW: could enhance here to only check for one player
            // based on whose move it is
            if (contains(setX, winSet)) {
                return [true, Player.X];
            }
            if (contains(setO, winSet)) {
                return [true, Player.O];
            }
        }

        return [false, null];
    }

    isOver(): boolean {
        return this.hasWinner()[0] ||
            this.availableMoves(Player.X).length == 0 &&
            this.availableMoves(Player.O).length == 0;
    }
}
