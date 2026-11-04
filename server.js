const express = require('express');
const app = express();
app.use(express.json({limit:'10mb'}));
let memory = [];
app.get('/', (req,res)=>{
res.send(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>B.S AI</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#000;color:#fff;height:100vh;display:flex;flex-direction:column}
.top{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #222}
.logo{display:flex;align-items:center;gap:10px}.logo div{width:36px;height:36px;background:#fff;color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900}
.memBtn{background:#111;border:1px solid #333;color:#fff;padding:8px 12px;border-radius:20px;cursor:pointer}
.chat{flex:1;overflow-y:auto;padding:20px;max-width:850px;width:100%;margin:0 auto}
.msg{margin-bottom:16px;line-height:1.6;white-space:pre-wrap}
.user{background:#1a1a1a;padding:14px 16px;border-radius:16px;margin-left:50px;text-align:right}
.ai{padding:14px 16px;background:#0a0a0a;border-left:2px solid #fff;border-radius:8px}
.ai img{max-width:100%;border-radius:12px;margin-top:10px}
.suggest{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:10px}
.suggest button{background:#111;border:1px solid #333;color:#ccc;padding:9px 13px;border-radius:20px;cursor:pointer}
.inputBox{display:flex;gap:8px;padding:14px;max-width:850px;width:100%;margin:0 auto}
.inputBox input{flex:1;padding:16px;background:#111;border:1px solid #333;border-radius:24px;color:#fff;font-size:15px;outline:none}
.inputBox button{border:none;padding:0 16px;border-radius:24px;cursor:pointer;font-weight:800}
.mic{background:#222;color:#fff}.sendBtn{background:#fff;color:#000;font-size:18px}
.memoryBox{display:none;padding:12px;background:#111;border:1px solid #333;margin:0 20px;border-radius:12px;max-height:150px;overflow-y:auto}
.empty{text-align:center;margin-top:80px;color:#888}.empty h1{color:#fff;font-size:42px;margin:0}
</style>
</head><body>
<div class="top"><div class="logo"><div>B</div><div><b>B.S AI</b><br><span style="color:#888;font-size:12px">Voice • Image • Memory • Code</span></div></div><button class="memBtn" onclick="showMemory()">🧠 Memory (<span id="memCount">0</span>)</button></div>
<div class="memoryBox" id="memoryBox"></div>
<div class="chat" id="chat">
<div class="empty" id="empty"><h1>Hey, I'm B.S AI</h1><p>Talk to me. Command me to write, code, draw, remind.</p></div>
<div class="suggest" id="suggest">
<button onclick="ask('Write code for a login website')">Write Code</button>
<button onclick="ask('image: a lion in Lagos at night, cinematic')">Generate Image</button>
<button onclick="ask('remind me to send $500 to John tomorrow')">Set Reminder</button>
<button onclick="ask('Write a payment message for $500 USDT')">Write Message</button>
</div>
</div>
<div class="inputBox"><input id="inp" placeholder="Ask B.S AI anything..." onkeydown="if(event.key==='Enter')send()"><button class="mic" onclick="startVoice()">🎤</button><button class="sendBtn" onclick="send()">↑</button></div>
<script>
let history=[];
let localMem=JSON.parse(localStorage.getItem('bs_mem')||'[]');
function updateMemCount(){document.getElementById('memCount').innerText=localMem.length}
updateMemCount();
function showMemory(){
let b=document.getElementById('memoryBox');
b.style.display=b.style.display=='block'?'none':'block';
if(localMem.length==0){b.innerHTML='No memory yet. Say: remember my wallet is ... or remind me to ...';return}
b.innerHTML='<b>🧠 B.S AI Memory:</b><br>'+localMem.map((m,i)=> (i+1)+'. '+m+' <button onclick="delMem('+i+')">x</button>').join('<br>');
}
function delMem(i){localMem.splice(i,1);localStorage.setItem('bs_mem',JSON.stringify(localMem));updateMemCount();showMemory()}
function ask(t){document.getElementById('inp').value=t;send()}
function startVoice(){
if(!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)){alert('Voice not supported, use Chrome');return}
let rec=new (window.SpeechRecognition||window.webkitSpeechRecognition)();
rec.lang='en-US';rec.onresult=function(e){document.getElementById('inp').value=e.results[0][0].transcript;send()};
rec.start();alert('Listening... speak now');
}
async function send(){
let inp=document.getElementById('inp');let text=inp.value.trim();if(!text)return;
document.getElementById('empty')?.remove();document.getElementById('suggest')?.remove();
let chat=document.getElementById('chat');
chat.innerHTML+='<div class="msg user">'+text+'</div><div class="msg ai" id="loading">B.S AI thinking...</div>';
chat.scrollTop=chat.scrollHeight;inp.value='';
let lower=text.toLowerCase();
if(lower.includes('remind me')||lower.includes('remember')){
localMem.push(text);localStorage.setItem('bs_mem',JSON.stringify(localMem));updateMemCount();
document.getElementById('loading').remove();
chat.innerHTML+='<div class="msg ai"><b>B.S AI:</b><br>✅ Saved to memory: '+text+'</div>';return;
}
if(lower.startsWith('image:')||lower.startsWith('generate image')||lower.includes('draw me')){
let prompt=text.replace(/image:|generate image|draw me/gi,'').trim()||'beautiful art';
document.getElementById('loading').remove();
let imgUrl='https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?width=1024&height=1024&seed='+Date.now();
chat.innerHTML+='<div class="msg ai"><b>B.S AI 🎨:</b><br>Generated: '+prompt+'<br><img src="'+imgUrl+'"><br><a href="'+imgUrl+'" target="_blank" style="color:#fff">Download Image</a></div>';
chat.scrollTop=chat.scrollHeight;return;
}
history.push({role:'user',content:text});
try{
let r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history,mem:localMem})});
let d=await r.json();
document.getElementById('loading').remove();
let reply=d.reply||'Error';
history.push({role:'assistant',content:reply});
chat.innerHTML+='<div class="msg ai"><b>B.S AI:</b><br>'+reply.replace(/\\n/g,'<br>')+'</div>';
chat.scrollTop=chat.scrollHeight;
}catch(e){document.getElementById('loading').innerText='Error: '+e.message}
}
</script>
</body></html>
`);
});
app.post('/api/chat', async (req,res)=>{
try{
let messages=req.body.messages||[];
let mem=req.body.mem||[];
let memText=mem.length? 'User memory: '+mem.join(' | ') : '';
let system={role:'system',content:'You are B.S AI, a powerful personal AI owned by B.S. You can write anything, write full code, emails, messages. Be direct, confident, like Grok. If user asks for code, give FULL working code. '+memText};
let r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
method:'POST',
headers:{'Authorization':'Bearer '+process.env.GROQ_API_KEY,'Content-Type':'application/json'},
body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[system,...messages],temperature:0.7})
});
let data=await r.json();
if(data.error) return res.json({reply:'API Error: '+data.error.message});
res.json({reply:data.choices[0].message.content});
}catch(e){res.json({reply:'Server error: '+e.message})}
});
app.listen(process.env.PORT||10000,()=>console.log('B.S AI live'));