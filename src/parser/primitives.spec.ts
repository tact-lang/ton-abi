import { ABITypeRef, beginCell } from "ton-core";
import { getPrimitiveSerializer } from "./primitives";

describe('primitives', () => {
    it('should parse integer values', () => {
        for (let i = 1; i < 257; i++) {
            let sc = beginCell().storeUint(1, i).endCell().beginParse();
            let type: ABITypeRef = {
                kind: 'simple',
                type: 'uint',
                format: i
            };
            let ser = getPrimitiveSerializer(type)!;
            let v = ser.serializer.load(sc, ser.type);
            if (i <= 32) {
                expect(ser.serializer.tsType).toBe('number');
                expect(v).toBe(1);
            } else {
                expect(ser.serializer.tsType).toBe('bigint');
                expect(v).toBe(1n);
            }
            // expect(ser.size.bits).toBe(i);
            // expect(ser.size.refs).toBe(0);
        }
    });

    it('should parse signed integer values', () => {
        for (let i = 1; i < 257; i++) {
            let sc = beginCell().storeInt(-1n, i).endCell().beginParse();
            let type: ABITypeRef = {
                kind: 'simple',
                type: 'int',
                format: i
            };
            let ser = getPrimitiveSerializer(type)!;
            let v = ser.serializer.load(sc, ser.type);
            if (i <= 32) {
                expect(ser.serializer.tsType).toBe('number');
                expect(v).toBe(-1);
            } else {
                expect(ser.serializer.tsType).toBe('bigint');
                expect(v).toBe(-1n);
            }
            // expect(ser.size.bits).toBe(i);
            // expect(ser.size.refs).toBe(0);
        }
    });
});