import logger from "../../logger";

class UserProfile {
    public collectionName: any;
    public collection: any;
    public db: any;

    constructor(db: any) {
        this.db = db
    }

    updateCollection(collection: string) {
        this.collectionName = collection;
        this.collection = this.db.collection(this.collectionName)
    }

    async add(
        collectionName: string,
        info: any,
        opts = { returnOriginal: true }
    ) {
        try {
            const inserteData = await this.db
                .collection(collectionName)
                .insertOne(info, opts);
            return inserteData;
            // return { _id: inserteData.insertId, ...inserteData.ops[0] };
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async bulkAdd(users: any, opts = { returnOriginal: false }) {
        return this.collection.insertMany(users, opts);
    }

    async update(
        collectionName: string,
        _id: any,
        info: any,
        opts = { returnOriginal: false },
    ) {
        return this.db.collection(collectionName).updateOne(
            { _id },
            info,
            opts,
        );
    }

    async updateByCond(
        collectionName: string,
        where: any,
        info: any,
        opts = { returnOriginal: false },
    ) {

        return this.db.collection(collectionName).updateOne(
            where,
            //   { $set: isValidSchema.value },
            info,
            opts,
        );
    }

    async get(collectionName: string, where: any) {
        return this.db.collection(collectionName).find(where).toArray();
    }
    async getlobby(collectionName: string, where: any, field: any) {
        return this.db.collection(collectionName).find(where).sort(field).toArray();
    }

    async getOne(collectionName: any, where: any) {
        return this.db.collection(collectionName).findOne(where);
    }
    async remove(collectionName: any, where: any) {
        return this.db.collection(collectionName).deleteOne(where);
    }
    async aggregate(collectionName: any, pipline: any) {
        return this.db.collection(collectionName).aggregate(pipline).toArray();
    }
    async distinct(collectionName: any, key: string, query?: any) {
        return this.db.collection(collectionName).distinct(key, query);
    }
}

export = UserProfile;