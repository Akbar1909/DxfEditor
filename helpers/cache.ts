/* eslint-disable no-underscore-dangle */
import Konva from 'konva';

type DxfEditorCacheValue = Konva.Line | Konva.Layer | Konva.Transformer | Konva.Group;

class DxfEditorCache {
    cache: Map<String, DxfEditorCacheValue> = new Map();

    private static _instance: DxfEditorCache;

    // eslint-disable-next-line no-empty-function
    private constructor() {}

    public static getInstance() {
        if (!this._instance) {
            this._instance = new DxfEditorCache();
            return this._instance;
        }

        return this._instance;
    }

    public setEntity<T extends DxfEditorCacheValue = Konva.Line>(handle: string, entity: T) {
        if (!this.cache.has(handle)) {
            this.cache.set(handle, entity);
        }
    }

    public getEntity<T extends DxfEditorCacheValue = Konva.Line>(handle: string): T | null {
        if (!this.cache.has(handle)) {
            return null;
        }

        return this.cache.get(handle) as T;
    }

    setMultipleEntities(entities: Konva.Line[]) {
        for (const entity of entities) {
            this.setEntity(entity.getAttr('name'), entity);
        }
    }

    getAllAsArray() {
        return Array.from(this.cache.values());
    }

    getStandsAsArray() {
        const stands = [];

        for (const value of this.cache.values()) {
            if (value instanceof Konva.Line) {
                stands.push(value);
            }
        }

        return stands as Konva.Line[];
    }

    deleteEntity(handle: string) {
        return this.cache.delete(handle);
    }

    clear() {
        this.cache.clear();
    }

    has(key: string) {
        return this.cache.has(key);
    }
}

const dxfEditorCache = DxfEditorCache.getInstance();

export default dxfEditorCache;
