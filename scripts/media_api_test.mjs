/* Mock Cloudflare R2 integration test: no network, no credentials. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";

globalThis.crypto ??= webcrypto;
const file=readFileSync("media-worker/src/index.js","utf8");
const worker=(await import("data:text/javascript;base64,"+Buffer.from(file).toString("base64"))).default;
const secret="test-admin-secret-never-use-in-production";
const URL_BASE="https://test-media.example";
const headers={"Origin":"https://spiralcactus.be","Authorization":"Bearer "+secret};

class MemoryBucket {
  objects=new Map();
  uploads=new Map();
  seq=0;
  async list({prefix="",cursor,limit=500,include=[]}={}) {
    const objects=[...this.objects.values()].filter(x=>x.key.startsWith(prefix)).sort((a,b)=>a.key.localeCompare(b.key));
    const offset=cursor?Number(cursor):0;
    return {objects:objects.slice(offset,offset+limit).map(o=>({
      key:o.key,size:o.size,customMetadata:include.includes("customMetadata")?o.customMetadata:{}
    })),truncated:objects.length>offset+limit,cursor:String(offset+limit)};
  }
  async head(key) {return this.objects.get(key)||null;}
  async get(key) {
    const obj=this.objects.get(key);
    if(!obj)return null;
    return {...obj,body:new Response(obj.bytes).body,range:undefined};
  }
  async delete(keys) {for(const key of Array.isArray(keys)?keys:[keys])this.objects.delete(key);}
  async createMultipartUpload(key,opts) {
    const id="up-"+(++this.seq);
    this.uploads.set(id,{key,opts,parts:new Map()});
    return {key,uploadId:id};
  }
  resumeMultipartUpload(key,id) {
    const up=this.uploads.get(id);
    if(!up||up.key!==key)throw Error("Upload not found");
    return {
      uploadPart:async(n,stream)=>{
        up.parts.set(n,Buffer.from(await new Response(stream).arrayBuffer()));
        return {partNumber:n,etag:"0123456789abcdef0123456789abcdef"};
      },
      complete:async(parts)=>{
        const bytes=Buffer.concat(parts.map(p=>up.parts.get(p.partNumber)));
        const o={key,size:bytes.length,bytes,customMetadata:up.opts.customMetadata||{},
          httpEtag:'"0123456789abcdef0123456789abcdef"',
          writeHttpMetadata:h=>h.set("Content-Type",up.opts.httpMetadata.contentType)};
        this.objects.set(key,o);this.uploads.delete(id);return o;
      },
      abort:async()=>{this.uploads.delete(id)}
    };
  }
}
const bucket=new MemoryBucket();
const env={MEDIA_BUCKET:bucket,SC_MEDIA_ADMIN_TOKEN:secret};
async function call(method,path,body,auth=true){
  const h=new Headers(headers);
  if(!auth)h.delete("Authorization");
  if(body && typeof body==="object" && !(body instanceof Uint8Array) && !Buffer.isBuffer(body)){
    body=JSON.stringify(body);h.set("Content-Type","application/json");
  }
  return worker.fetch(new Request(URL_BASE+path,{method,headers:h,body}),env);
}
async function start(album,type,name,size,variant,originalKey=""){
  const res=await call("POST","/api/upload/start",{album,type,name,size,variant,originalKey});
  assert.equal(res.status,200,await res.text());return res.json();
}
async function upload(result,bytes){
  const res=await call("PUT","/api/upload/part?key="+encodeURIComponent(result.key)+
    "&uploadId="+encodeURIComponent(result.uploadId)+"&part=1",bytes);
  assert.equal(res.status,200,await res.text());
  const part=await res.json();
  const finish=await call("POST","/api/upload/finish",{key:result.key,uploadId:result.uploadId,parts:[part]});
  assert.equal(finish.status,200,await finish.text());return finish.json();
}
const album="2026-10-16-acid-edition";
assert.equal((await call("GET","/api/auth",undefined,false)).status,401);
assert.equal((await call("GET","/health")).status,200);
const original=await start(album,"image/jpeg","party.jpg",7,"original");
await upload(original,Buffer.from("fake high resolution JPEG bytes"));
const preview=await start(album,"image/webp","party.webp",5,"preview",original.key);
await upload(preview,Buffer.from("WEBP!"));
const listed=await (await call("GET","/api/gallery?event="+album)).json();
assert.equal(listed.items.length,1,"originals must not appear in the gallery");
assert.equal(listed.items[0].hasOriginal,true);
assert.ok(listed.items[0].downloadUrl.includes("/originals/"),"HD links must point at originals");
const previewResponse=await call("GET","/media/"+preview.key);
assert.equal(previewResponse.status,200);
assert.equal(await previewResponse.text(),"WEBP!");
assert.equal((await call("GET","/media/"+original.key)).status,404,"raw originals must not be embedded");
const download=await call("GET","/download/"+original.key);
assert.equal(download.status,200);
assert.match(download.headers.get("Content-Disposition"),/attachment/);
assert.equal(await download.text(),"fake high resolution JPEG bytes");
const blocked=await call("POST","/api/upload/start",{
  album,type:"image/webp",name:"bad.webp",size:2,variant:"preview",
  originalKey:"albums/2026-08-28-brussels-rave-night/originals/bad.jpg"
});
assert.equal(blocked.status,400,"must block linking originals from another album");
const removed=await call("DELETE","/api/media?key="+encodeURIComponent(preview.key));
assert.equal(removed.status,200);
assert.equal(bucket.objects.size,0,"deleting a preview must delete its HD original too");
const video=await start(album,"video/mp4","set.mp4",3,"preview");
await upload(video,Buffer.from("mp4"));
const vlisted=await (await call("GET","/api/gallery?event="+album)).json();
assert.equal(vlisted.items[0].type,"video");
assert.ok(vlisted.items[0].downloadUrl.includes("/videos/"));
console.log("Media API tests passed: auth, HD pairing, preview, video, download and cascade deletion.");
