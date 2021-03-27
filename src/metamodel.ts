enum NodeType {
    Place=0,
    Transition=1,
}

// DSL interface
export interface ModelDsl {
    role: (label: string) => Role;
    cell: (label: string, initial?: number, capacity?: number) => Node;
    fn: (label: string, role: Role) => Node;
}

// Domain Specific Language (DSL) model definition errors
export const ErrorBadInhibitorSource: Error = new Error("inhibitor source must be a place");
export const ErrorBadInhibitorTarget: Error = new Error("inhibitor target must be a transitions");
export const ErrorBadArcWeight: Error = new Error("arc weight must be positive int");
export const ErrorBadArcTransition: Error = new Error("source and target are both transitions");
export const ErrorBadArcPlace: Error = new Error("source and target are both places");
export const ErrorFrozenModel: Error = new Error("model cannot be updated after it is frozen");


export type Place = {
    label: string;
    offset: number;
    initial?: number;
    capacity?: number;
}

export type Transition = {
    label: string;
    role: Role;
    offset: number;
    delta?: Array<number>;
    guards?: Map<string, Guard>;
}

export type Role = {
    label: string;
}

export type Arc = {
    source: Node;
    target: Node;
    weight: number;
    inhibitor?: boolean;
}

export type Guard = {
    label: string;
    delta: Array<number>;
}

class Node {
    private metaModel: MetaModel // parent relation
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

    guard(weight: number, target: Node) {
        if (!this.isPlace()) {
            throw ErrorBadInhibitorSource;
        }
        if (!target.isTransition()) {
            throw ErrorBadInhibitorTarget;
        }
        /* FIXME
        this.metaModel.({
            source: this,
            target: target,
            weight: weight,
            inhibitor: true,
            label: lable
         */
        return this;
    }

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

export class Net {
    places: Map<string, Place>;
    transitions: Map<string, Transition>;

    constructor() {
        this.places = new Map<string, Place>();
        this.transitions = new Map<string, Transition>();
    }

    emptyVector(): Array<number> {
        return new Array<number>(this.places.size).fill(0);
    }

    initialState(): Array<number> {
        const out: Array<number> = [];
        // can this use map?
        this.places.forEach((pl: Place) => {
            out[pl.offset] = pl.initial || 0;
        });
        return out;
    }

    stateCapacity(): Array<number> {
        const out: Array<number> = [];
        this.places.forEach((pl: Place) => {
            out[pl.offset] = pl.capacity;
        });
        return out;
    }
}

export class MetaModel extends Net {
    frozen: boolean // indicate model is finalized
    roles: Map<string, Role>;
    arcs: Array<Arc>

    constructor() {
        super();
        this.frozen = false;
        this.arcs = new Array<Arc>();
        this.roles = new Map<string, Role>();
        };

    assertNotFrozen(): void {
        if (this.frozen) { throw ErrorFrozenModel; }
    }

    reindex(): void {
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

    role(def: string): Role {
        this.assertNotFrozen();
        const r: Role = {label: def};
        this.roles.set(def, r);
        return r;
    }

    cell(label: string, initial?: number, capacity?: number): Node {
        this.assertNotFrozen();
        const offset = this.places.size;
        const n = new Node(this, label, NodeType.Place);
        n.place = { label, offset, initial, capacity};
        this.places.set(label, n.place);
        return n;
    }

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


