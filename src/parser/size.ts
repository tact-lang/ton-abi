import { ABITypeRef } from "ton-core";

export function getSimpleFieldSize(src: ABITypeRef): { bits: number, refs: number } {
    if (src.kind === 'dict') {
        return { bits: 0, refs: 1 };
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
