export interface CacheConstructor {
    new(): Cache<unknown, unknown>;
    new <K, V>(entries?: ReadonlyArray<readonly [K, V]> | null): Cache<K, V>;
    new <K, V>(iterable: Iterable<readonly [K, V]>): Cache<K, V>;
    readonly prototype: Cache<unknown, unknown>;
    readonly [Symbol.species]: CacheConstructor;
}

export class Cache<K, V> extends Map<K, V> {
    public constructor(entries?: ReadonlyArray<readonly [K, V]> | null) {
        super(entries);
    }

    /**
     * 
     * @param key Key to check if value exists in Cache, otherwise set it
     * @param value Value to set if key does not exist
     * @returns Value of key
     */
    public ensure(key: K, value: V): V {
        if (!this.has(key)) this.set(key, value);
        return this.get(key)!;
    }

    /**
     * 
     * @param keys Keys to check if exists in Cache
     * @returns { boolean } Whether all keys exist in Cache
     */
    public hasAll(...keys: K[]): boolean {
        return keys.every((key) => this.has(key));
    }

    /**
     * 
     * @param keys Keys to check if exists in Cache
     * @returns { boolean } Whether any key exists in Cache
     */
    public hasAny(...keys: K[]): boolean {
        return keys.some((key) => this.has(key));
    }

    /**
     * 
     * @param index Index of value to get
     * @returns Value at index in Cache or undefined
     */
    public at(index: number): V | undefined {
        return [...this.values()][index];
    }

    /**
     * 
     * @param index Index of key to get
     * @returns Key at index in Cache or undefined
     */
    public keyAt(index: number): K | undefined {
        return [...this.keys()][index];
    }

    /**
     * @param amount Amount of random values to get
     * @returns Random value in Cache or undefined
     */
    public random(): V | undefined;
    public random(amount: number): V[];
    public random(amount?: number): V | V[] | undefined {
        const arr = [...this.values()];
        if (amount === undefined) return arr.length ? [arr[Math.floor(Math.random() * arr.length)]] : undefined;
        if (amount < 1) return [];
        if (amount > arr.length) return arr;
        const out: V[] = [];
        for (let i = 0; i < amount; i++) {
            const rand = Math.floor(Math.random() * arr.length);
            out.push(arr[rand]);
            arr.splice(rand, 1);
        }
        return out;
    }

    /**
     * @param amount Amount of random keys to get
     * @returns Random key in Cache or undefined
     */
    public randomKey(): K | undefined;
    public randomKey(amount: number): K[];
    public randomKey(amount?: number): K | K[] | undefined {
        const arr = [...this.keys()];
        if (amount === undefined) return arr.length ? [arr[Math.floor(Math.random() * arr.length)]] : undefined;
        if (amount < 1) return [];
        if (amount > arr.length) return arr;
        const out: K[] = [];
        for (let i = 0; i < amount; i++) {
            const rand = Math.floor(Math.random() * arr.length);
            out.push(arr[rand]);
            arr.splice(rand, 1);
        }
        return out;
    }

    /**
    * Reverse the cache
    */
    public reverse() {
        const entries = [...this.entries()].reverse();
        this.clear();
        for (const [k, v] of entries) this.set(k, v);
        return this;
    }

    /**
     * Shuffle randomly the cache order
     */
    public shuffle() {
        const entries = [...this.entries()];
        this.clear();
        while (entries.length) {
            const rand = Math.floor(Math.random() * entries.length);
            const [k, v] = entries.splice(rand, 1)[0];
            this.set(k, v);
        }
        return this;
    }

    /**
     * @param amount Amount of values to get
     * @returns Firsts specified amount of values in Cache or undefined
     */
    public first(): V | undefined;
    public first(amount: number): V[];
    public first(amount?: number): V | V[] | undefined {
        if (amount === undefined) return this.at(0);
        if (amount < 0) return this.last(amount * -1).reverse();
        if (amount === 0) return [];
        const out: V[] = [];
        for (let i = 0; i < amount; i++) {
            const val = this.at(i);
            if (val === undefined) break;
            out.push(val);
        }
        return out;
    }

    /**
     * @param amount Amount of keys to get
     * @returns Firsts specified amount of keys in Cache or undefined
     */
    public firstKey(): K | undefined;
    public firstKey(amount: number): K[];
    public firstKey(amount?: number): K | K[] | undefined {
        if (amount === undefined) return this.keyAt(0);
        if (amount < 0) return this.lastKey(amount * -1).reverse();
        if (amount === 0) return [];
        const out: K[] = [];
        for (let i = 0; i < amount; i++) {
            const val = this.keyAt(i);
            if (val === undefined) break;
            out.push(val);
        }
        return out;
    }

    /**
     * @param amount Amount of keys to get
     * @returns Firsts specified amount of keys in Cache or undefined
     */
    public last(): V | undefined;
    public last(amount: number): V[];
    public last(amount?: number): V | V[] | undefined {
        if (amount === undefined) return this.at(this.size - 1);
        if (amount < 0) return this.first(amount * -1).reverse();
        if (amount === 0) return [];
        const out: V[] = [];
        for (let i = this.size - 1; i >= 0; i--) {
            const val = this.at(i);
            if (val === undefined) break;
            out.push(val);
        }
        return out;
    }

    /**
     * @param amount Amount of keys to get
     * @returns Firsts specified amount of keys in Cache or undefined
    */
    public lastKey(): K | undefined;
    public lastKey(amount: number): K[];
    public lastKey(amount?: number): K | K[] | undefined {
        if (amount === undefined) return this.keyAt(this.size - 1);
        if (amount < 0) return this.firstKey(amount * -1).reverse();
        if (amount === 0) return [];
        const out: K[] = [];
        for (let i = this.size - 1; i >= 0; i--) {
            const val = this.keyAt(i);
            if (val === undefined) break;
            out.push(val);
        }
        return out;
    }

    /**
     * @param fn Function to map values
     * @returns Mapped values 
    */
    public filter<K2 extends K>(fn: (value: V, key: K, cache: this) => key is K2): Cache<K2, V>;
    public filter<V2 extends V>(fn: (value: V, key: K, cache: this) => value is V2): Cache<K, V2>;
    public filter(fn: (value: V, key: K, cache: this) => unknown): Cache<K, V>;
    public filter(fn: (value: V, key: K, cache: this) => unknown): Cache<K, V> {
        const out = new Cache<K, V>();
        for (const [k, v] of this) if (fn(v, k, this)) out.set(k, v);
        return out;
    }

    /**
     * 
     * @param fn Function to find value
     * @returns Value found
     */
    public find(fn: (value: V, key: K, cache: this) => unknown): V | undefined {
        for (const [k, v] of this) if (fn(v, k, this)) return v;
        return undefined;
    }

    /**
     * @param fn Function to test values
     * @returns Whether a value pass the test
     */
    public some(fn: (value: V, key: K, cache: this) => unknown): boolean {
        for (const [k, v] of this) if (fn(v, k, this)) return true;
        return false;
    }

    /**
     * 
     * @param fn Function to test values
     * @returns Whether all values pass the test
     */
    public map<T>(fn: (value: V, key: K, collection: this) => T): T[];
    public map<This, T>(fn: (this: This, value: V, key: K, collection: this) => T, thisArg: This): T[];
    public map<T>(fn: (value: V, key: K, collection: this) => T, thisArg?: unknown): T[] {
        if (typeof fn !== 'function') throw new TypeError(`${fn} is not a function`);
        if (thisArg !== undefined) fn = fn.bind(thisArg);
        const iter = this.entries();
        return Array.from({ length: this.size }, (): T => {
            const [key, value] = iter.next().value;
            return fn(value, key, this);
        });
    }

}