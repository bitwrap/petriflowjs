import {MetaModel, ModelDsl, Net } from "./metamodel";


export type ModelDeclaration = (modelDef: ModelDsl) => void

export class Model extends MetaModel {
    schema: string

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
}
