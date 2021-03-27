import {Move, Player, Turn, v1 as octoeV1} from "./octoe.pflow";
import {Model} from "../src";
import {StateMachine} from "../src/statemachine";

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
 * Play a game of tic-tac-toe using the petri-net model
 */
export class Octoe extends StateMachine {
    model: Model
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
        super();
        this.model = new Model("octoe", octoeV1);
        this.places = this.model.places;
        this.transitions = this.model.transitions;
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
        return this.state[this.offset(Turn.O)] == 1;
    }

    /**
     * Check for X turn
     */
    isTurnX (): boolean {
        return this.state[this.offset(Turn.X)] == 1;
    }

    /**
     * Perform state transformation and
     * store record player role and move location in ledger
     * @param action
     */
    move(action: string): [Error, Array<number>, string] {
        const [err, out, role] = this.transform(this.state, action, 1);
        if (!err) {
            this.state = out;
            this.ledger.push({ role: role.label, moved: action.substr(1) });
        }
        return [err, out, role.label];
    }

    /**
     * list valid moves for game state
     * @param role filter by authorized roles
     */
    availableMoves(role: string): Array<string> {
        const moves = new Array<string>();
        for (const action of this.actions()) {
            const [err, out, requireRole] = this.transform(this.state, action, 1);
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
            if (contains(setX, winSet)) {
                return [true, Player.X];
            }
            if (contains(setO, winSet)) {
                return [true, Player.O];
            }
        }

        return [false, null];
    }

    /**
     * Test if game is over
     */
    isOver(): boolean {
        return this.hasWinner()[0] ||
            this.availableMoves(Player.X).length == 0 &&
            this.availableMoves(Player.O).length == 0;
    }
}
