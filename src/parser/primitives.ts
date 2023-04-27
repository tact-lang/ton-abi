import { ABITypeRef, Builder, Slice } from 'ton-core';

export type PrimitiveSerializer<T, V> = {

    // Typescript type
    tsType: string,

    // Load/store
    load: (src: Slice, d: T) => V,
    store: (builder: Builder, d: T, v: V) => void,

    // Matcher
    match: (src: ABITypeRef) => T | null
}

//
// Integer
//

const intSerializer: PrimitiveSerializer<{ size: number, signed: boolean }, number> = {
    tsType: `number`,
    load: (src, d) => d.signed ? src.loadInt(d.size) : src.loadUint(d.size),
    store: (builder, d, v) => d.signed ? builder.storeInt(v, d.size) : builder.storeUint(v, d.size),
    match: (src) => {
        if (src.kind === 'simple') {
            if (src.type === 'int' || src.type === 'uint') {
                let signed = src.type === 'int';
                let size: number | undefined = undefined;
                if (typeof src.format === 'number') {
                    size = src.format;
                } else if (src.format === null || src.format === undefined) {
                    size = 257;
                }
                if (size !== undefined && size >= 1 && size <= 32 && !src.optional) {
                    return { size, signed };
                }
            }
        }
        return null;
    }
}

const intOptSerializer: PrimitiveSerializer<{ size: number, signed: boolean }, number | null> = {
    tsType: `number | null`,
    load: (src, d) => d.signed ? src.loadMaybeInt(d.size) : src.loadMaybeUint(d.size),
    store: (builder, d, v) => d.signed ? builder.storeMaybeInt(v, d.size) : builder.storeMaybeUint(v, d.size),
    match: (src) => {
        if (src.kind === 'simple') {
            if (src.type === 'int' || src.type === 'uint') {
                let signed = src.type === 'int';
                let size: number | undefined = undefined;
                if (typeof src.format === 'number') {
                    size = src.format;
                } else if (src.format === null || src.format === undefined) {
                    size = 257;
                }
                if (size !== undefined && size >= 1 && size <= 32 && !!src.optional) {
                    return { size, signed };
                }
            }
        }
        return null;
    }
}

//
// Big Integer
//

const bigintSerializer: PrimitiveSerializer<{ size: number, signed: boolean }, bigint> = {
    tsType: `bigint`,
    load: (src, d) => d.signed ? src.loadIntBig(d.size) : src.loadUintBig(d.size),
    store: (builder, d, v) => d.signed ? builder.storeInt(v, d.size) : builder.storeUint(v, d.size),
    match: (src) => {
        if (src.kind === 'simple') {
            if (src.type === 'int' || src.type === 'uint') {
                let signed = src.type === 'int';
                let size: number | undefined = undefined;
                if (typeof src.format === 'number') {
                    size = src.format;
                } else if (src.format === null || src.format === undefined) {
                    size = 257;
                }
                if (size !== undefined && !src.optional) {
                    return { size, signed };
                }
            }
        }
        return null;
    }
}

const bigintOptSerializer: PrimitiveSerializer<{ size: number, signed: boolean }, bigint | null> = {
    tsType: `bigint | null`,
    load: (src, d) => d.signed ? src.loadMaybeIntBig(d.size) : src.loadMaybeUintBig(d.size),
    store: (builder, d, v) => d.signed ? builder.storeMaybeInt(v, d.size) : builder.storeMaybeUint(v, d.size),
    match: (src) => {
        if (src.kind === 'simple') {
            if (src.type === 'int' || src.type === 'uint') {
                let signed = src.type === 'int';
                let size: number | undefined = undefined;
                if (typeof src.format === 'number') {
                    size = src.format;
                } else if (src.format === null || src.format === undefined) {
                    size = 257;
                }
                if (size !== undefined && !!src.optional) {
                    return { size, signed };
                }
            }
        }
        return null;
    }
}

//
// Coins
//

const coinsSerializer: PrimitiveSerializer<{}, bigint> = {
    tsType: `bigint`,
    load: (src, d) => src.loadCoins(),
    store: (builder, d, v) => builder.storeCoins(v),
    match: (src) => {
        if (src.kind === 'simple') {
            if (src.type === 'int' || src.type === 'uint') {
                let signed = src.type === 'int';
                let size: number | undefined = undefined;
                if (src.format === 'coins') {
                    return {};
                }
            }
        }
        return null;
    }
}

const coinsOptSerializer: PrimitiveSerializer<{}, bigint | null> = {
    tsType: `bigint`,
    load: (src, d) => src.loadMaybeCoins(),
    store: (builder, d, v) => builder.storeMaybeCoins(v),
    match: (src) => {
        if (src.kind === 'simple' && src.type === 'uint' && src.format === 'coins') {
            return {};
        }
        return null;
    }
}

//
// Resolver
//

const serializers: PrimitiveSerializer<any, any>[] = [
    intSerializer,
    intOptSerializer,
    bigintSerializer,
    bigintOptSerializer,
    coinsSerializer,
    coinsOptSerializer
];

export function getPrimitiveSerializer(type: ABITypeRef) {
    for (let s of serializers) {
        let matched = s.match(type);
        if (matched !== null) {
            return { serializer: s, type: matched };
        }
    }
    return null;
}