
import {
    Role,
    Guard,
    Net,
} from "./metamodel";

export const ErrorInvalidPlace: Error = new Error("invalid place");
export const ErrorInvalidAction: Error = new Error("invalid action");
export const ErrorInvalidOutput: Error = new Error("output cannot be negative");
export const ErrorExceedsCapacity: Error = new Error("output exceeds capacity");
export const ErrorGuardCheckFailure: Error = new Error("guard condition failure");

export class StateMachine extends Net {

    /**
     * Perform vector addition, asserting that bounds are not exceeded
     * @param state
     * @param delta
     * @param multiplier
     * @param capacity
     */
    add(state: Array<number>, delta: Array<number>, multiplier: number, capacity: Array<number>): [Error, Array<number>] {
        let err = null;
        const out = this.emptyVector();
        state.forEach((value, index) => {
            const sum = value + delta[index] * multiplier;
            if (sum < 0) {
                err = ErrorInvalidOutput;
            }
            if ((capacity && (capacity[index] > 0 && sum > capacity[index]))) {
                err = ErrorExceedsCapacity;
            }
            out[index] = sum;
        });
        return [err, out];
    }

    /**
     * List avialable actions
     */
    actions(): IterableIterator<string> {
        return this.transitions.keys();
    }

    /**
     * Return defined transition
     * @param transition
     */
    action(transition: string): [Array<number>, Role, Map<string, Guard>] {
        try{
            const tx = this.transitions.get(transition);
            return [tx.delta, tx.role, tx.guards];
        } catch {
            throw ErrorInvalidAction;
        }
    }

    /**
     * Perform state transformation returning an error if it is invalid
     * @param inputState - starting state vector
     * @param transaction - label of transaction to apply
     * @param multiplier - number of iterations to apply
     */
    transform(inputState: Array<number>, transaction: string, multiplier: number): [Error, Array<number>, Role] {
        const [delta, role, guards] = this.action(transaction);
        for( const [, guard] of guards) {
            const [check, out] = this.add(inputState, guard.delta, multiplier, this.emptyVector());
            if (check == null) {
                return [ErrorGuardCheckFailure, out, role];
            }
        }
        const [err, out] = this.add(inputState, delta, multiplier, this.stateCapacity());
        return [err, out, role];
    }

    /**
     * Get offset of place by label
     * @param label
     */
    offset(label: string) {
        const pl = this.places.get(label);
        if (! pl) {
            throw ErrorInvalidPlace;
        }
        return pl.offset;
    }

    /**
     * Get offset of place by label
     * @param label
     */
    actionId(label: string) {
        const act = this.transitions.get(label);
        if (! act) {
            throw ErrorInvalidAction;
        }
        return act.offset;
    }

}
