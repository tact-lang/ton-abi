import { ABIType, ABITypeRef, Slice } from "ton-core";
import { getPrimitiveSerializer } from "./primitives";

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
        let r = this.#types.get(name);
        if (!r) {
            return r;
        } else {
            return r.raw;
        }
    }

    parse(src: Slice) {
        let header = src.preloadUint(32);
        let type = this.get(header);
        if (!type) {
            throw new Error(`Type with header ${header} is not registered`);
        }
        return this._parse(src, type);
    }

    private _parse(src: Slice, type: ABIType) {

        let available = { bits: 1023 - ALLOCATOR_RESERVE_BIT, refs: 4 - ALLOCATOR_RESERVE_REF };

        // Check header
        if (type.header !== null && type.header !== undefined) {
            let header = src.loadUint(32);
            if (header !== type.header) {
                throw new Error(`Expected header ${type.header}, got ${header}`);
            }
            available.bits -= 32;
        }

        // Process fields
        let res: any = { '$$type': type.name };
        for (let f of type.fields) {

            // Load size
            let opSize: { bits: number, refs: number };
            if (f.type.kind === 'simple' && this.#types.has(f.type.type)) {
                opSize = this.size(f.type.type);
            } else {
                opSize = getSimpleFieldSize(f.type);
            }

            // Advance
            if (opSize.bits > available.bits || opSize.refs > available.refs) {
                available = { bits: 1023 - ALLOCATOR_RESERVE_BIT, refs: 4 - ALLOCATOR_RESERVE_REF }
                src = src.loadRef().beginParse();
            }

            // Load field
            let value: any;
            if (f.type.kind === 'simple' && this.#types.has(f.type.type)) {
                value = this._parse(src, this.get(f.type.type)!);
            } if (f.type.kind === 'dict') {
                throw Error('Not implemented');
            } else {
                let serializer = getPrimitiveSerializer(f.type);
                if (!serializer) {
                    throw Error('Not implemented');
                }
                value = serializer.serializer.load(src, serializer.type);
            }

            // Set field
            res[f.name] = value;
        }

        return res;
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

function getSimpleFieldSize(src: ABITypeRef): { bits: number, refs: number } {
    if (src.kind === 'dict') {
        return { bits: 1, refs: 1 };
    } else if (src.kind === 'simple') {
        if (src.type === 'int' || src.type === 'uint') {
            let size = 257;
            if (typeof src.format === 'number') {
                size = src.format;
            } else if (src.format === 'coins') {
                size = 124;
            } else if (src.format !== null && src.format !== undefined) {
                throw new Error(`Unsupported format ${JSON.stringify(src.format)}`);
            }
            if (src.optional) {
                size++;
            }
            return { bits: size, refs: 0 };
        } else if (src.type === 'bool') {
            if (src.format !== null && src.format !== undefined) {
                throw new Error(`Unsupported format ${JSON.stringify(src.format)}`);
            }
            return { bits: 1 + (src.optional ? 1 : 0), refs: 0 };
        } else if (src.type === 'address') {
            if (src.format !== null && src.format !== undefined) {
                throw new Error(`Unsupported format ${JSON.stringify(src.format)}`);
            }
            return { bits: 267, refs: 0 };
        } else if (src.type === 'slice' || src.type === 'cell' || src.type === 'builder') {
            if (src.format !== null && src.format !== undefined) {
                throw new Error(`Unsupported format ${JSON.stringify(src.format)}`);
            }
            return { bits: (src.optional ? 1 : 0), refs: 1 };
        } else if (src.type === 'string') {
            if (src.format !== null && src.format !== undefined) {
                throw new Error(`Unsupported format ${JSON.stringify(src.format)}`);
            }
            return { bits: (src.optional ? 1 : 0), refs: 1 };
        }
    }

    throw new Error(`Unsupported type ${JSON.stringify(src)}`);
}
