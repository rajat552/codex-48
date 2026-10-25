import mongoose from 'mongoose';
import { logger } from './logger.js';

class InMemoryCollection {
  constructor(name) {
    this.name = name;
    this.documents = new Map();
  }

  matchQuery(doc, query = {}) {
    for (const [key, val] of Object.entries(query)) {
      if (key === '$or') {
        if (!Array.isArray(val) || !val.some(subQ => this.matchQuery(doc, subQ))) {
          return false;
        }
        continue;
      }
      if (key === '$and') {
        if (!Array.isArray(val) || !val.every(subQ => this.matchQuery(doc, subQ))) {
          return false;
        }
        continue;
      }

      // Handle nested keys e.g. 'settings.allowedChannels'
      const actualVal = this.getNestedVal(doc, key);

      if (val && typeof val === 'object' && !(val instanceof Date) && !(val instanceof mongoose.Types.ObjectId)) {
        if ('$ne' in val) {
          if (String(actualVal) === String(val.$ne)) return false;
        }
        if ('$lte' in val) {
          if (!(actualVal <= val.$lte)) return false;
        }
        if ('$lt' in val) {
          if (!(actualVal < val.$lt)) return false;
        }
        if ('$gt' in val) {
          if (!(actualVal > val.$gt)) return false;
        }
        if ('$gte' in val) {
          if (!(actualVal >= val.$gte)) return false;
        }
        if ('$exists' in val) {
          const exists = actualVal !== undefined && actualVal !== null;
          if (exists !== val.$exists) return false;
        }
        if ('$in' in val) {
          if (!Array.isArray(val.$in) || !val.$in.map(String).includes(String(actualVal))) return false;
        }
      } else if (val instanceof Date) {
        if (new Date(actualVal).getTime() !== val.getTime()) return false;
      } else if (val !== undefined) {
        if (String(actualVal) !== String(val)) return false;
      }
    }
    return true;
  }

  getNestedVal(obj, path) {
    const parts = path.split('.');
    let curr = obj;
    for (const p of parts) {
      if (!curr) return undefined;
      curr = curr[p];
    }
    return curr;
  }

  applySort(docs, sortObj = {}) {
    if (!sortObj || Object.keys(sortObj).length === 0) return docs;
    return docs.sort((a, b) => {
      for (const [key, dir] of Object.entries(sortObj)) {
        const valA = this.getNestedVal(a, key);
        const valB = this.getNestedVal(b, key);
        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
      }
      return 0;
    });
  }

  wrapDocument(raw) {
    if (!raw) return null;
    const doc = { ...raw };
    doc._id = doc._id || new mongoose.Types.ObjectId();
    doc.id = doc._id.toString();

    doc.save = async () => {
      doc.updatedAt = new Date();
      this.documents.set(doc._id.toString(), { ...doc });
      return doc;
    };

    doc.toObject = () => ({ ...doc });
    doc.toJSON = () => ({ ...doc });
    doc.toSafeObject = () => {
      const copy = { ...doc };
      delete copy.passwordHash;
      return copy;
    };

    return doc;
  }

  async create(data) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(d => this.create(d)));
    }
    const id = (data._id || new mongoose.Types.ObjectId()).toString();
    const newDoc = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(id),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    };
    this.documents.set(id, newDoc);
    return this.wrapDocument(newDoc);
  }

  find(query = {}) {
    const all = Array.from(this.documents.values());
    const matched = all.filter(d => this.matchQuery(d, query)).map(d => this.wrapDocument(d));
    let sortObj = null;
    let limitNum = null;

    const queryObj = {
      sort: (s) => {
        sortObj = s;
        return queryObj;
      },
      limit: (l) => {
        limitNum = l;
        return queryObj;
      },
      populate: () => queryObj,
      then: (resolve, reject) => {
        let res = this.applySort(matched, sortObj);
        if (limitNum) res = res.slice(0, limitNum);
        return Promise.resolve(res).then(resolve, reject);
      }
    };
    return queryObj;
  }

  findOne(query = {}) {
    const all = Array.from(this.documents.values());
    let sortObj = null;

    const queryObj = {
      sort: (s) => {
        sortObj = s;
        return queryObj;
      },
      populate: () => queryObj,
      then: (resolve, reject) => {
        let matched = all.filter(d => this.matchQuery(d, query));
        matched = this.applySort(matched, sortObj);
        const result = matched.length > 0 ? this.wrapDocument(matched[0]) : null;
        return Promise.resolve(result).then(resolve, reject);
      }
    };
    return queryObj;
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  async findOneAndUpdate(query, update, options = {}) {
    const doc = await this.findOne(query);
    if (!doc) return null;

    const updated = { ...doc };
    if (update.$set) Object.assign(updated, update.$set);
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        updated[k] = (updated[k] || 0) + v;
      }
    }
    updated.updatedAt = new Date();
    this.documents.set(doc._id.toString(), updated);
    return this.wrapDocument(options.new ? updated : doc);
  }

  async updateMany(query, update) {
    const docs = await this.find(query);
    for (const d of docs) {
      if (update.$set) Object.assign(d, update.$set);
      else Object.assign(d, update);
      await d.save();
    }
    return { modifiedCount: docs.length };
  }

  async countDocuments(query = {}) {
    const docs = await this.find(query);
    return docs.length;
  }

  clear() {
    this.documents.clear();
  }
}

export class InMemoryStore {
  static collections = new Map();

  static getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection(name));
    }
    return this.collections.get(name);
  }

  static clearAll() {
    for (const col of this.collections.values()) {
      col.clear();
    }
  }
}
