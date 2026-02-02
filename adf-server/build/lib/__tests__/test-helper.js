import { createServer } from "../../server.js";
let _server = null;
export function getServer() {
    if (!_server) {
        _server = createServer();
    }
    return _server;
}
export async function callTool(name, args = {}) {
    const server = getServer();
    const tools = server._registeredTools;
    const tool = tools[name];
    if (!tool)
        throw new Error(`Tool '${name}' not found`);
    return tool.handler(args, {});
}
