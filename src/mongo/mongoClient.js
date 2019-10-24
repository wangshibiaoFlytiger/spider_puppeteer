const config = require('config');
let mongoose = require('mongoose');

/**
 * 获取mongo客户端
 * @param uri
 * @returns {Connection}
 */
function getMongoClient(uri) {
    const options = {
        useMongoClient: true,
        autoIndex: false, // Don't build indexes
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 10, // Maintain up to 10 socket connections
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0
    };

    try {
        const mongoClient = mongoose.createConnection(uri, options)
        /**
         * Mongo 连接成功回调
         */
        mongoClient.on('connected', function () {
            console.log('Mongoose connected to ' + uri);
        });
        /**
         * Mongo 连接失败回调
         */
        mongoClient.on('error', function (err) {
            console.log('Mongoose connection error: ' + err);
        });
        /**
         * Mongo 关闭连接回调
         */
        mongoClient.on('disconnected', function () {
            console.log('Mongoose disconnected');
        });

        return mongoClient;
    } catch (e) {
        console.error(e);
    }
}

let mongoClient = getMongoClient(config.get("mongo.uri"));

/*var schema = new mongoose.Schema({ num:Number, name: String, size: String });
var MyModel = mongoose.model('MyModel', schema);
var doc1 = new MyModel({ size: 'small' });
doc1.save(function (err,doc) {
    console.log(doc);
})*/

module.exports = {
    mongoClient
}