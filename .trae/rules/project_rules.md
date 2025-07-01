1. 用户编辑 → Slate 编辑器捕获操作
2. CRDT 转换 → Yjs 将编辑转换为 CRDT 操作
3. 本地持久化 → IndexedDB 自动保存
4. 网络传输 → HocuspocusProvider 通过 WebSocket 发送
5. 服务端处理 → @hocuspocus/server 接收并持久化到数据库
6. 广播同步 → 服务端广播给其他客户端
7. 远程更新 → 其他客户端接收并应用更新