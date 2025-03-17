const { ObjectID } = require('mongodb')
import query from "./query";

class DB {
    public mongoClient: any;
    public mongo: any;
    public mongoQuery: any;
    public ObjectId: any;

    init(db: any, client: any) {
        this.mongoClient = client;
        this.ObjectId = ObjectID;
        this.mongoQuery = new query(db)
    }
}

export = new DB();