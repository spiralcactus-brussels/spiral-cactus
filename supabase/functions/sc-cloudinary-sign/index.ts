// Deploy as Supabase Edge Function 'sc-cloudinary-sign' (JWT verification enabled).
// CLOUDINARY_API_SECRET MUST remain in Supabase function secrets — never in GitHub's public JS.
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigin='https://spiralcactus-brussels.github.io';
const cors={ 'Access-Control-Allow-Origin':allowedOrigin,
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST,OPTIONS', 'Vary':'Origin' };
const response=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{
  status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}
});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return response({error:'Method not allowed'},405);
 const origin=req.headers.get('origin');
 if(origin&&origin!==allowedOrigin)return response({error:'Origin not allowed'},403);
 const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
 if(!jwt)return response({error:'Sign in first'},401);
 const url=Deno.env.get('SUPABASE_URL');
 const publishable=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
 const cloudName=Deno.env.get('CLOUDINARY_CLOUD_NAME');
 const apiKey=Deno.env.get('CLOUDINARY_API_KEY');
 const secret=Deno.env.get('CLOUDINARY_API_SECRET');
 if(!url||!publishable||!cloudName||!apiKey||!secret)return response({error:'Server is not configured'},503);
 const db=createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false},
   global:{headers:{Authorization:'Bearer '+jwt}}});
 const {data:{user},error:authError}=await db.auth.getUser(jwt);
 if(authError||!user)return response({error:'Authentication failed'},401);
 const {data:membership,error:roleError}=await db.from('sc_admins').select('role').eq('user_id',user.id).maybeSingle();
 if(roleError||!membership)return response({error:'Not an authorized administrator'},403);
 const timestamp=Math.floor(Date.now()/1000);
 const folder='spiralcactus-gallery';
 const toSign='folder='+folder+'&timestamp='+timestamp;
 const digest=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(toSign+secret));
 const signature=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
 return response({cloudName,apiKey,folder,timestamp,signature});
});
