/** Read-only local preview; serve only public design assets. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT} from './icon-cdn.mjs';
const port=Number(process.argv[2])||3861;
const allowed=/^(?:badges\/design\/(?:gallery\.html|preview\.png|native-preview\.png|glyph-concept\.png)|badges\/badge-images\/files\/[a-f0-9]{16}\.png|assets\/fonts\/Manrope\.ttf)$/;
http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'){res.writeHead(302,{Location:'/badges/design/gallery.html'});res.end();return;}
 const relative=pathname.slice(1);
 if(req.method!=='GET'||!allowed.test(relative)){res.writeHead(404);res.end();return;}
 try{
  const b=await fs.readFile(path.join(ROOT,relative));
  const type=relative.endsWith('.png')?'image/png':relative.endsWith('.ttf')?'font/ttf':'text/html; charset=utf-8';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(`Kanso badge gallery: http://127.0.0.1:${port}/badges/design/gallery.html`));
