import { serve } from 'bun';

const connections = new Set<WebSocket>();

// 新增文本内容接口
async function handleTextRequest(url: URL) {
  try {
    const start = parseInt(url.searchParams.get('start') || '0');
    const length = parseInt(url.searchParams.get('length') || '10');
    
    const file = Bun.file('./sample.txt');
    const content = await file.text();
    const end = Math.min(start + length, content.length);
    
    return new Response(JSON.stringify({
      text: content.slice(start, end),
      end: end
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '文件读取失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

serve({
  port: 3000,
  hostname: "10.182.1.100",
  async fetch(req, server) {
    const url = new URL(req.url);
    
    if (url.pathname === '/chat') {
      const success = server.upgrade(req);
      return success ? undefined : new Response('WebSocket升级失败', { status: 400 });
    }
    
    if (url.pathname === '/text') {
      return handleTextRequest(url);
    }
    
    return new Response(Bun.file('./index.html'));
  },
  websocket: {
    open(ws) {
      connections.add(ws);
    },
    message(ws, message) {
      connections.forEach(conn => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    },
    close(ws) {
      connections.delete(ws);
    }
  }
});

console.log('服务器运行在 http://localhost:3000');