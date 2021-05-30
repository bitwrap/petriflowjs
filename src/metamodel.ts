enum NodeType {
    Place=0,
    Transition=1,
}

const ErrorBadInhibitorSource: Error = new Error("inhibitor source must be a place");
const ErrorBadInhibitorTarget: Error = new Error("inhibitor target must be a transitions");
const ErrorBadArcWeight: Error = new Error("arc weight must be positive int");
const ErrorBadArcTransition: Error = new Error("source and target are both transitions");
const ErrorBadArcPlace: Error = new Error("source and target are both places");
const ErrorFrozenModel: Error = new Error("model cannot be updated after it is frozen");

/**
 * Places contain tokens
 */
 type Place = {
    label: string;
    offset: number;
    initial?: number;
    capacity?: number;
}

/**
 * Transitions move tokens between Places
 */
 type Transition = {
    label: string;
    role: Role;
    offset: number;
    delta?: Array<number>;
    guards?: Map<string, Guard>;
}

/**
 * Roles provide a basis of an Access Control
 * Role assertions helps bind program behavior to a model
 */
 type Role = {
    label: string;
}

/**
 * Arcs define the bridges between Places
 */
 type Arc = {
    source: Node;
    target: Node;
    weight: number;
    inhibitor?: boolean;
}

/**
 * A Guard is a conditional rule than inhibits a Transition.
 *
 * Given: Inhibitor Arc (Guard) = g1
 * defined as a relation: p1(g1) -> t1(w1)
 *
 * A Guard rule can be stated as:
 * If Place p1 has more than weight <w1> tokens, inhibit the transformation t1.
 *
 */
 type Guard = {
    label: string;
    delta: Array<number>;
}

/**
 * Nodes serve as syntactic sugar to bridge elements of the DSL
 */
class Node {
    metaModel: MetaModel // parent relation
    public label: string
    public nodeType: NodeType
    public place?: Place
    public transition?: Transition

    constructor(metaModel: MetaModel, label: string, nodeType: NodeType) {
        this.metaModel = metaModel;
        this.label = label;
        this.nodeType = nodeType;
    }

    isPlace(): boolean {
        return this.nodeType == NodeType.Place;
    }

    isTransition(): boolean {
        return this.nodeType == NodeType.Transition;
    }

    /**
     * create a guard definition
     * @param weight - conditional check, a transaction is fire-able if a place's token state is below this threshold.
     * @param target - Transition node to target for this rule.
     */
    guard(weight: number, target: Node) {
        if (!this.isPlace()) {
            throw ErrorBadInhibitorSource;
        }
        if (!target.isTransition()) {
            throw ErrorBadInhibitorTarget;
        }
        this.metaModel.arcs.push({
            source: this,
            target: target,
            weight: weight,
            inhibitor: true,
        });
        return this;
    }

    /**
     * Define an Arc to transmit between two Nodes
     * @param weight - tokens required to activate transition
     * @param target - target node to receive transmitted tokens
     */
    tx(weight: number, target: Node) {
        if (weight <= 0) {
            throw ErrorBadArcWeight;
        }
        if (this.isPlace() && target.isPlace()) {
            throw ErrorBadArcPlace;
        }
        if (this.isTransition() && target.isTransition()) {
            throw ErrorBadArcTransition;
        }
        this.metaModel.arcs.push({
            source: this,
            target: target,
            weight: weight,
        });
        return this;
    }
}

/**
 * Indexed Petri-Net data structure
 */
 class Net {
    places: Map<string, Place>;
    transitions: Map<string, Transition>;

    constructor() {
        this.places = new Map<string, Place>();
        this.transitions = new Map<string, Transition>();
    }

    /**
     * Builds a properly sized [0]*n vector for this model.
     */
    emptyVector(): Array<number> {
        return new Array<number>(this.places.size).fill(0);
    }

    /**
     * Collect initial place conditions into a vector.
     * Used to initialize state machine when transacting with a Model.
     */
    initialState(): Array<number> {
        const out: Array<number> = [];
        // can this use map?
        this.places.forEach((pl: Place) => {
            out[pl.offset] = pl.initial || 0;
        });
        return out;
    }

    /**
     * Collect capacity limits into a vector
     */
    stateCapacity(): Array<number> {
        const out: Array<number> = [];
        this.places.forEach((pl: Place) => {
            out[pl.offset] = pl.capacity;
        });
        return out;
    }
}

/**
 * MetaModel - converts DSL structures into a vector addition system.
 * https://en.wikipedia.org/wiki/Vector_addition_system
 */
 class MetaModel extends Net {
    private frozen: boolean // indicate model is finalized
    roles: Map<string, Role>;
    arcs: Array<Arc>

    constructor() {
        super();
        this.frozen = false;
        this.arcs = new Array<Arc>();
        this.roles = new Map<string, Role>();
    };

    private assertNotFrozen(): void {
        if (this.frozen) { throw ErrorFrozenModel; }
    }

    /**
     * Traverse the syntax tree of the DSL
     * Operations are validated, indexed and vectorized
     */
    protected reindex(): void {
        this.frozen = true;
        this.transitions.forEach((txn: Transition) => {
            txn.delta = this.emptyVector(); // right-size all vectors
        });
        this.arcs.forEach((arc: Arc) => {
            if (arc.inhibitor) {
                const g: Guard = {
                    label: arc.source.place.label,
                    delta: this.emptyVector(),
                };
                g.delta[arc.source.place.offset] = 0-arc.weight;
                arc.target.transition.guards.set(arc.source.place.label, g);
            } else {
                if (!arc.source || !arc.target) {
                    throw Error("incomplete arc definition");
                }

                if (arc.source.isPlace()) {
                    arc.target.transition.delta[arc.source.place.offset] = 0-arc.weight;
                } else {
                    arc.source.transition.delta[arc.target.place.offset] = arc.weight;
                }
            }
        });
    }

    /**
     * Roles are used to map access control rules onto the Petri-Net model.
     * @param def - unique name for this role
     */
    role(def: string): Role {
        this.assertNotFrozen();
        const r: Role = {label: def};
        this.roles.set(def, r);
        return r;
    }

    /**
     * Cells - containers that hold tokens.
     *
     * In PetriNet terms a Cell is identical to a Place.
     * Used as either the target or source of a transition declaration.
     * @param label - name of the cell
     * @param initial - initial token value
     * @param capacity - max token capacity
     */
    cell(label: string, initial?: number, capacity?: number): Node {
        this.assertNotFrozen();
        const offset = this.places.size;
        const n = new Node(this, label, NodeType.Place);
        n.place = { label, offset, initial, capacity};
        this.places.set(label, n.place);
        return n;
    }

    /**
     * fn - 'Partial Functions' declaration
     *
     * Used as either the target or source of a transition declaration.
     * @param label - name of this transition
     * @param role - pre-defined role required to execute function
     */
    fn(label: string, role: Role): Node {
        this.assertNotFrozen();
        const guards = new Map<string,Guard>();
        const delta = new Array<number>();
        const n = new Node(this, label, NodeType.Transition);
        const offset = this.transitions.size;
        n.transition = {label, role: role, delta, guards, offset};
        this.transitions.set(label, n.transition);
        return n;
    }
}

export interface ModelDsl {
    role: (label: string) => Role;
    cell: (label: string, initial?: number, capacity?: number) => Node;
    fn: (label: string, role: Role) => Node;
}

type ModelDeclaration = (modelDef: ModelDsl) => void

export const ErrorInvalidPlace: Error = new Error("invalid place");
export const ErrorInvalidAction: Error = new Error("invalid action");
export const ErrorInvalidOutput: Error = new Error("output cannot be negative");
export const ErrorExceedsCapacity: Error = new Error("output exceeds capacity");
export const ErrorGuardCheckFailure: Error = new Error("guard condition failure");

class StateMachine extends MetaModel {
    schema: string;

    constructor(schema: string, declaration: ModelDeclaration) {
        super();
        this.schema = schema;
        declaration({
            role: this.role.bind(this),
            cell: this.cell.bind(this),
            fn: this.fn.bind(this),
        });
        this.reindex();
    }

    /**
     * Perform vector addition, asserting that bounds are not exceeded
     * @param state
     * @param delta
     * @param multiplier
     * @param capacity
     * @private
     */
    private add(state: Array<number>, delta: Array<number>, multiplier: number, capacity: Array<number>): [Error, Array<number>] {
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
     * List available actions
     */
    actions(): IterableIterator<string> {
        return this.transitions.keys();
    }

    /**
     * Return defined transition by label
     * @param transitionLabel
     */
    action(transitionLabel: string): [Array<number>, Role, Map<string, Guard>] {
        try{
            const tx = this.transitions.get(transitionLabel);
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
     * @param placeLabel
     */
    offset(placeLabel: string): number {
        const pl = this.places.get(placeLabel);
        if (! pl) {
            throw ErrorInvalidPlace;
        }
        return pl.offset;
    }

    /**
     * Get offset of place by label
     * @param transitionLabel
     */
    actionId(transitionLabel: string): number {
        const act = this.transitions.get(transitionLabel);
        if (! act) {
            throw ErrorInvalidAction;
        }
        return act.offset;
    }

}

export interface Model {
    schema: string;
    places: Map<string, Place>;
    transitions: Map<string, Transition>;
    emptyVector(): Array<number>;
    initialState(): Array<number>;
    stateCapacity(): Array<number>;
    transform(inputState: Array<number>, transaction: string, multiplier: number): [Error, Array<number>, Role];
    actions(): IterableIterator<string>;
    action(transitionLabel: string): [Array<number>, Role, Map<string, Guard>];
    actionId(transitionLabel: string): number;
    offset(placeLabel: string): number;
}

/**
 * Load Petri-net declaration as an executable model.
 * @param schema - name of this model
 * @param declaration - callback to invoke DSL code declarations
 */
export function NewModel(schema: string, declaration: ModelDeclaration): Model {
    return new StateMachine(schema, declaration);
}

