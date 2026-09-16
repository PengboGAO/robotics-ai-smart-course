import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root = process.cwd();
const port = Number(process.env.PORT) || 4173;
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json", ".png":"image/png", ".svg":"image/svg+xml", ".csv":"text/csv; charset=utf-8", ".m":"text/plain; charset=utf-8", ".md":"text/plain; charset=utf-8" };
createServer(async (request,response)=>{
  try {
    const urlPath = decodeURIComponent(new URL(request.url,"http://localhost").pathname);
    const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/,"");
    let file = normalize(join(root,relative));
    if (!file.startsWith(root)) throw new Error("invalid path");
    if ((await stat(file)).isDirectory()) file = join(file,"index.html");
    response.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-cache"}); response.end(await readFile(file));
  } catch { response.writeHead(404,{"Content-Type":"text/html; charset=utf-8"}); response.end(await readFile(join(root,"404.html"))); }
}).listen(port,()=>console.log(`课程预览：http://localhost:${port}`));
