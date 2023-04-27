import { ABIType } from "ton-core";
import { TypeRegistry } from "./types";

describe('types', () => {
    it('should allocate types', () => {
        const types: ABIType[] = [{
            "name": "Deploy",
            "header": 2490013878,
            "fields": [
                {
                    "name": "queryId",
                    "type": {
                        "kind": "simple",
                        "type": "uint",
                        "optional": false,
                        "format": 64
                    }
                }
            ]
        }, {
            "name": "FactoryDeploy",
            "header": 1829761339,
            "fields": [
                {
                    "name": "queryId",
                    "type": {
                        "kind": "simple",
                        "type": "uint",
                        "optional": false,
                        "format": 64
                    }
                },
                {
                    "name": "cashback",
                    "type": {
                        "kind": "simple",
                        "type": "address",
                        "optional": false
                    }
                }
            ]
        }];
        let registry = new TypeRegistry();
        for (let t of types) {
            registry.register(t);
        }
        let size = registry.size('Deploy');
        expect(size.bits).toBe(32 + 64);
        expect(size.refs).toBe(0);
        size = registry.size('FactoryDeploy');
        expect(size.bits).toBe(32 + 64 + 267);
        expect(size.refs).toBe(0);
    });
});