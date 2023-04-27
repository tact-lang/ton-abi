import { ABIType } from "ton-core";
import { getSimpleFieldSize } from "./size";

const ALLOCATOR_RESERVE_BIT = 1;
const ALLOCATOR_RESERVE_REF = 1;

export class TypeRegistry {

    #types = new Map<string, { raw: ABIType, size?: { bits: number, refs: number } }>();
    #prefixes = new Map<number, string>();

    register(type: ABIType) {
        if (this.#types.has(type.name)) {
            throw new Error(`Type ${type.name} is already registered`);
        }
        if (type.header !== null && type.header !== undefined) {
            if (this.#prefixes.has(type.header)) {
                throw new Error(`Type with header ${type.header} is already registered`);
            }
            this.#prefixes.set(type.header, type.name);
        }
        this.#types.set(type.name, { raw: type });
        return this;
    }

    get(value: number | string) {
        let name: string;
        if (typeof value === 'number') {
            let n = this.#prefixes.get(value);
            if (!n) {
                throw new Error(`Type with header ${value} is not registered`);
            }
            name = n;
        } else {
            name = value;
        }
        return this.#types.get(name);
    }

    size(name: string) {

        // Check cache
        let type = this.#types.get(name);
        if (!type) {
            throw new Error(`Type ${name} is not registered`);
        }
        if (type.size) {
            return type.size;
        }

        // Allocate
        let used: { bits: number, refs: number } = { bits: 0, refs: 0 };
        let available = { bits: 1023 - ALLOCATOR_RESERVE_BIT, refs: 4 - ALLOCATOR_RESERVE_REF };
        if (type.raw.header !== null && type.raw.header !== undefined) {
            available.bits -= 32;
            used.bits += 32;
        }
        for (let f of type.raw.fields) {
            let opSize: { bits: number, refs: number };
            if (f.type.kind === 'simple' && this.#types.has(f.type.type)) {
                opSize = this.size(f.type.type);
            } if (f.type.kind === 'dict') {
                opSize = { bits: 1, refs: 1 };
            } else {
                opSize = getSimpleFieldSize(f.type);
            }
            if (opSize.bits > available.bits || opSize.refs > available.refs) {
                break;
            }
            used.bits += opSize.bits;
            used.refs += opSize.refs;
            available.bits -= opSize.bits;
            available.refs -= opSize.refs;
        }

        type.size = used;
        return used;
    }
}