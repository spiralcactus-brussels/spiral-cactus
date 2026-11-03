/* SpiralCactus media API — Cloudflare Worker + R2.
   Public: listing and media playback. Private: upload/delete with Worker secret.
   DO NOT put SC_MEDIA_ADMIN_TOKEN in GitHub or in browser source. */
const SLUG = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,90}$/;
const ALBUM_KEY = /^albums\/\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,90}\/(photos|videos)\/[a-z0-9][a-z0-9._-]{0,190}$/;
const TYPES = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov"
};
const MIME = {jpg:"image/jpeg",png:"image/png",webp:"image/webp",avif:"image/avif",mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime"};
const origins = new Set([
  "https://spiralcactus.be", "https://www.spiralcactus.be",
  "https://spiralcactus-brussels.github.io"
]);
function cors(request) {
  const origin=request.headers.get("Origin");
  const h=new Headers({"Vary":"Origin","Access-Control-Allow-Methods":"GET, HEAD, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":"Authorization, Content-Type", "Access-Control-Max-Age":"86400"});
  if(origins.has(origin))h.set("Access-Control-Allow-Origin",origin);
  return h;
}
function reply(request,payload,status=200) {
  return new Response(JSON.stringify(payload),{status,headers:new Headers([...cors(request),["Content-Type","application/json; charset=utf-8"],["Cache-Control","no-store"]])});
}
function validKey(key) { return ALBUM_KEY.test(key||""); }
function fileName(name) {
  const cleaned=String(name||"media").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^[._-]+|[._-]+$/g,"").slice(0,85);
  return cleaned||"media";
}
async function checkAuth(request,env) {
  const supplied=request.headers.get("Authorization")||"";
  const secret=env.SC_MEDIA_ADMIN_TOKEN||"";
  if(!secret || !supplied.startsWith("Bearer ") || supplied.length>700)return false;
  const dig=async s=>new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
  const a=await dig(supplied.slice(7)),b=await dig(secret);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
async function gallery(request,env,url) {
  const cursor=url.searchParams.get("cursor")||undefined;
  const wanted=url.searchParams.get("event");
  if(wanted&&!SLUG.test(wanted))return reply(request,{error:"Invalid album"},400);
  const prefix=wanted?"albums/"+wanted+"/":"albums/";
  const result=await env.MEDIA_BUCKET.list({prefix,cursor,limit:500});
  const items=result.objects.filter(o=>validKey(o.key)).map(o=>{
    const seg=o.key.split("/");
    return {album:seg[1],type:seg[2]==="videos"?"video":"photo",name:seg[3].replace(/^[0-9]{13}-[a-f0-9-]{36}-/,""),
      key:o.key,size:o.size,url:new URL("/media/"+o.key,request.url).href};
  });
  return reply(request,{items,nextCursor:result.truncated?result.cursor:null});
}
async function serveMedia(request,env,key,download=false) {
  if(!validKey(key))return reply(request,{error:"Not found"},404);
  const range=request.headers.get("Range");
  const item=await env.MEDIA_BUCKET.get(key,range?{range:request.headers}:undefined);
  if(!item)return new Response("Not found",{status:404,headers:cors(request)});
  const h=cors(request);
  item.writeHttpMetadata(h);
  const ext=key.split(".").pop();
  h.set("Content-Type",MIME[ext]||"application/octet-stream");
  const originalName = key.split("/").pop().replace(/[^a-zA-Z0-9._-]/g,"_");
  h.set("Content-Disposition",download ? 'attachment; filename="'+originalName+'"' : "inline");
  h.set("Accept-Ranges","bytes");
  h.set("ETag",item.httpEtag);
  h.set("Cache-Control","public, max-age=31536000, immutable");
  const isPartial=!!(range&&item.range);
  h.set("Content-Length",String(isPartial?item.range.length:item.size));
  if(isPartial)h.set("Content-Range","bytes "+item.range.offset+"-"+(item.range.offset+item.range.length-1)+"/"+item.size);
  return new Response(request.method==="HEAD"?null:item.body,{status:isPartial?206:200,headers:h});
}
async function api(request,env,url) {
  if(!await checkAuth(request,env))return reply(request,{error:"Accès refusé. Vérifie le mot de passe d'administration."},401);
  if(url.pathname==="/api/auth"&&request.method==="GET")return reply(request,{ok:true});
  if(url.pathname==="/api/upload/start"&&request.method==="POST"){
    const x=await request.json();
    const album=String(x.album||""),type=String(x.type||"");
    if(!SLUG.test(album)||!TYPES[type])return reply(request,{error:"Album ou format de fichier invalide."},400);
    const kind=type.startsWith("image/")?"photos":"videos";
    const size=Number(x.size);
    if(!Number.isFinite(size)||size<1||size>5*1024**4)return reply(request,{error:"Taille invalide."},400);
    const ext=TYPES[type];
    const name=fileName(String(x.name||"media").replace(/\.[a-z0-9]{1,6}$/i,""));
    const key="albums/"+album+"/"+kind+"/"+Date.now()+"-"+crypto.randomUUID()+"-"+name+"."+ext;
    const upload=await env.MEDIA_BUCKET.createMultipartUpload(key,{httpMetadata:{contentType:type,cacheControl:"public, max-age=31536000, immutable"}});
    return reply(request,{key,uploadId:upload.uploadId});
  }
  if(url.pathname==="/api/upload/part"&&request.method==="PUT") {
    const key=url.searchParams.get("key"),id=url.searchParams.get("uploadId");
    const part=Number(url.searchParams.get("part"));
    if(!validKey(key)||!id||!Number.isSafeInteger(part)||part<1||part>10000||!request.body)
      return reply(request,{error:"Part upload parameters invalid"},400);
    if(Number(request.headers.get("content-length"))>10*1024*1024)return reply(request,{error:"Part too large"},413);
    const upload=env.MEDIA_BUCKET.resumeMultipartUpload(key,id);
    return reply(request,await upload.uploadPart(part,request.body));
  }
  if(url.pathname==="/api/upload/finish"&&request.method==="POST") {
    const x=await request.json();
    if(!validKey(x.key)||typeof x.uploadId!=="string"||!Array.isArray(x.parts)||x.parts.length<1||x.parts.length>10000)
      return reply(request,{error:"Invalid multipart completion"},400);
    const parts=x.parts.map(p=>({partNumber:Number(p.partNumber),etag:String(p.etag||"")}));
    if(parts.some(p=>!Number.isSafeInteger(p.partNumber)||p.partNumber<1||p.partNumber>10000||!/^[a-f0-9]{32}$/i.test(p.etag)))
      return reply(request,{error:"Invalid multipart part identifiers"},400);
    parts.sort((a,b)=>a.partNumber-b.partNumber);
    const upload=env.MEDIA_BUCKET.resumeMultipartUpload(x.key,x.uploadId);
    const obj=await upload.complete(parts);
    return reply(request,{ok:true,key:obj.key,url:new URL("/media/"+obj.key,request.url).href});
  }
  if(url.pathname==="/api/upload/cancel"&&request.method==="POST") {
    const x=await request.json();
    if(!validKey(x.key)||typeof x.uploadId!=="string")return reply(request,{error:"Invalid multipart upload"},400);
    await env.MEDIA_BUCKET.resumeMultipartUpload(x.key,x.uploadId).abort();
    return reply(request,{ok:true});
  }
  if(url.pathname==="/api/media"&&request.method==="DELETE") {
    const key=url.searchParams.get("key");
    if(!validKey(key))return reply(request,{error:"Invalid object key"},400);
    await env.MEDIA_BUCKET.delete(key);
    return reply(request,{ok:true});
  }
  return reply(request,{error:"Endpoint not found"},404);
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url), h=cors(request);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:h});
    if(request.headers.has("Origin")&&!origins.has(request.headers.get("Origin")))
      return reply(request,{error:"Origin not allowed"},403);
    if(!env.MEDIA_BUCKET)return reply(request,{error:"R2 binding MEDIA_BUCKET missing"},503);
    try {
      if(url.pathname==="/health")return reply(request,{ok:true,service:"SpiralCactus media"});
      if(url.pathname==="/api/gallery"&&request.method==="GET")return await gallery(request,env,url);
      if(url.pathname.startsWith("/media/")&&["GET","HEAD"].includes(request.method))
        return await serveMedia(request,env,url.pathname.slice(7),false);
      if(url.pathname.startsWith("/download/")&&["GET","HEAD"].includes(request.method))
        return await serveMedia(request,env,url.pathname.slice(10),true);
      if(url.pathname.startsWith("/api/"))return await api(request,env,url);
      return reply(request,{error:"Not found"},404);
    }catch(e) {
      console.error("Media API failure:",e);
      return reply(request,{error:"Media server error",details:String(e).slice(0,180)},500);
    }
  }
};
