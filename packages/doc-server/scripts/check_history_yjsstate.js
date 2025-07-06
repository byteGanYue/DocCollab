//
import { MongoClient } from 'mongodb'
import { Y } from 'yjs'
 
// === 配置区 ===
const MONGO_URL = 'mongodb://localhost:30123'; // 修改为你的MongoDB连接
const DB_NAME = 'admin'; // 修改为你的数据库名
const HISTORY_COLLECTION = 'documenthistoryentities'; // 历史快照表名

async function isXmlText(yjsStateArr) {
    try {
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, new Uint8Array(yjsStateArr));
        const content = ydoc.get('content');
        return content instanceof Y.XmlText;
    } catch (e) {
        return false;
    }
}

async function main() {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(HISTORY_COLLECTION);

    const cursor = col.find({ yjsState: { $exists: true, $ne: null } });
    let total = 0;
    let errorCount = 0;
    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        total++;
        const { yjsState, versionId, documentId, _id } = doc;
        if (!Array.isArray(yjsState)) continue;
        const ok = await isXmlText(yjsState);
        if (!ok) {
            errorCount++;
            console.log(`[ERROR] 非Y.XmlText快照: versionId=${versionId || _id}, documentId=${documentId}`);
        }
    }
    console.log(`\n检测完成，总快照数: ${total}，非Y.XmlText快照数: ${errorCount}`);
    await client.close();
}

main().catch(err => {
    console.error('检测脚本异常:', err);
    process.exit(1);
}); 