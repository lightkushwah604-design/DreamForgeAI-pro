/* =========================================================
   DREAMFORGE AI - PART 3
   COMPLETE CORRECTED SCRIPT
   ---------------------------------------------------------
   Chat
   Hindi / English / Hinglish
   Text -> Image
   Image -> Image
   Image preview
   Chat history
   Voice -> Text
   Text -> Voice
   Voice -> Voice COMING SOON
   Loading
   Toast
   Animations
   Mobile friendly
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE =
  window.DREAMFORGE_API ||
  "https://dreamforgeai-pro.onrender.com";

function getV6Session()  "reply": "...",
  "agent": "default"
}{
  try  "reply": "...",
  "agent": "default"
}{ return JSON.parse(localStorage.getItem("dreamforge_google_session_v1") || "null"); }catch(_){ return null; }
}
function v6AccountKey(base){
  const u=getV6Session();
  const id=String(u?.sub || u?.email || "guest").replace(/[^a-zA-Z0-9._-]/g,"_");
  return base + "_" + id;
}

const IMAGE_API =
  API_BASE + "/generate";

const CHAT_API =
  API_BASE + "/chat";

const HISTORY_KEY =
  v6AccountKey("dreamforge_ai_chat_history_v1");

const VOICE_HISTORY_KEY =
  v6AccountKey("dreamforge_ai_voice_history_v1");


/* =========================================================
   ELEMENTS
========================================================= */

const chat =
  document.getElementById("chat");

const welcome =
  document.getElementById("welcome");

const promptInput =
  document.getElementById("prompt");

const imageInput =
  document.getElementById("imageInput");

const generateBtn =
  document.getElementById("generateBtn");

const previewContainer =
  document.getElementById("previewContainer");

const uploadPreview =
  document.getElementById("uploadPreview");

const removeImage =
  document.getElementById("removeImage");

const loading =
  document.getElementById("loading");

const loadingTitle =
  document.getElementById("loadingTitle");

const loadingText =
  document.getElementById("loadingText");

const voiceBtn =
  document.getElementById("voiceBtn");

const attachBtn =
  document.getElementById("attachBtn");

const menuBtn =
  document.getElementById("menuBtn");

const settingsBtn =
  document.getElementById("settingsBtn");


/* =========================================================
   STATE
========================================================= */

let selectedFile = null;

let recognition = null;

let isBusy = false;

let isListening = false;

let currentMode =
  "chat";

let lastGeneratedImage =
  null;

let voiceToVoiceComingSoon =
  false;

let voiceToVoiceActive =
  false;


/* =========================================================
   HISTORY
========================================================= */

let chatHistory =
  loadHistory();

let voiceHistory =
  loadVoiceHistory();


function loadHistory(){

  try{

    const saved =
      localStorage.getItem(
        HISTORY_KEY
      );

    if(!saved){
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  }catch(error){

    console.error(
      "History load error:",
      error
    );

    return [];

  }

}


function saveHistory(){

  try{

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        chatHistory
      )
    );

  }catch(error){

    console.error(
      "History save error:",
      error
    );

  }

}


function loadVoiceHistory(){

  try{

    const saved =
      localStorage.getItem(
        VOICE_HISTORY_KEY
      );

    if(!saved){
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  }catch(error){

    console.error(
      "Voice history error:",
      error
    );

    return [];

  }

}


function saveVoiceHistory(){

  try{

    localStorage.setItem(
      VOICE_HISTORY_KEY,
      JSON.stringify(
        voiceHistory
      )
    );

  }catch(error){

    console.error(
      "Voice history save error:",
      error
    );

  }

}


function addHistoryMessage(
  role,
  content
){

  if(
    !content ||
    typeof content !== "string"
  ){
    return;
  }

  chatHistory.push({

    role: role,

    content: content,

    time: Date.now()

  });

  if(
    chatHistory.length > 40
  ){

    chatHistory =
      chatHistory.slice(-40);

  }

  saveHistory();

}


/* =========================================================
   RESTORE HISTORY
========================================================= */

function restoreHistory(){

  if(!chat){
    return;
  }

  if(
    !chatHistory.length
  ){
    return;
  }

  chatHistory.forEach(
    item => {

      if(
        !item ||
        !item.content
      ){
        return;
      }

      if(
        item.role === "user"
      ){

        addUserMessage(
          item.content,
          false
        );

      }else if(
        item.role === "assistant"
      ){

        addAssistantMessage(
          item.content,
          false
        );

      }

    }
  );

}


/* =========================================================
   SAFE TEXT
========================================================= */

function escapeHTML(
  value
){

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value ?? "");

  return div.innerHTML;

}


/* =========================================================
   SCROLL
========================================================= */

function scrollChat(){
  if(!chat) return;
  requestAnimationFrame(()=>{
    chat.scrollTo({top:chat.scrollHeight,behavior:"smooth"});
    setTimeout(()=>chat.scrollTo({top:chat.scrollHeight,behavior:"smooth"}),80);
  });
}


/* =========================================================
   MODE
========================================================= */

function setMode(
  mode
){

  currentMode =
    mode || "chat";

  document.body.dataset.mode =
    currentMode;

}


/* =========================================================
   ADD USER MESSAGE
========================================================= */

function addUserMessage(
  text,
  save = true
){

  if(!chat){
    return;
  }

  if(welcome){
    welcome.style.display =
      "none";
  }

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "df-message user-message";

  wrapper.innerHTML = `
    <div class="df-bubble user-bubble">
      ${escapeHTML(text)}
    </div>
  `;

  chat.appendChild(
    wrapper
  );

  if(save){

    addHistoryMessage(
      "user",
      text
    );

  }

  scrollChat();

}


/* =========================================================
   ADD ASSISTANT MESSAGE
========================================================= */

function addAssistantMessage(
  text,
  save = true
){

  if(!chat){
    return;
  }

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "df-message assistant-message";

  const cleanText = cleanAssistantReply(text);

  wrapper.innerHTML = `
    <div class="df-avatar">✦</div>
    <div class="df-assistant-stack">
      <div class="df-bubble assistant-bubble">
        ${formatAIText(cleanText)}
      </div>
      <div class="df-message-actions" aria-label="Message actions">
        <button type="button" data-msg-action="like" title="Like">♡</button>
        <button type="button" data-msg-action="dislike" title="Not helpful">♧</button>
        <button type="button" data-msg-action="copy" title="Copy">⧉</button>
        <button type="button" data-msg-action="share" title="Share">↗</button>
        <button type="button" data-msg-action="reply" title="Reply">↩</button>
        <button type="button" data-msg-action="regenerate" title="Regenerate">↻</button>
      </div>
    </div>
  `;

  wrapper.querySelectorAll("[data-msg-action]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const action=btn.dataset.msgAction;
      if(action==="like" || action==="dislike"){
        btn.classList.toggle("active");
        btn.textContent = action==="like" ? (btn.classList.contains("active")?"♥":"♡") : (btn.classList.contains("active")?"♣":"♧");
      }else if(action==="copy"){
        try{ await navigator.clipboard.writeText(cleanText); showToast("✓ Reply copied"); }catch(e){ showToast("Copy unavailable"); }
      }else if(action==="share"){
        try{
          if(navigator.share) await navigator.share({title:"DreamForge AI",text:cleanText});
          else { await navigator.clipboard.writeText(cleanText); showToast("✓ Reply copied — share it anywhere"); }
        }catch(e){}
      }else if(action==="reply"){
        if(promptInput){ promptInput.value="Reply to: "+cleanText.slice(0,180); autoGrowInput(); promptInput.focus(); }
      }else if(action==="regenerate"){
        if(promptInput){ promptInput.value=cleanText; autoGrowInput(); generateBtn?.click(); }
      }
    });
  });

  chat.appendChild(
    wrapper
  );

  if(save){

    addHistoryMessage(
      "assistant",
      text
    );

  }

  scrollChat();

}


/* =========================================================
   AI TEXT FORMAT
========================================================= */

function cleanAssistantReply(text){
  if(!text || typeof text !== "string") return "";
  let out = text.replace(/\[Visual:[\s\S]*?\]/gi, "");
  out = out.replace(/^\s*(?:assistant|dreamforge ai)\s*:\s*/i, "");
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

function formatAIText(
  text
){

  if(
    !text ||
    typeof text !== "string"
  ){
    return "";
  }

  let safe =
    escapeHTML(text);

  safe =
    safe.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

  safe =
    safe.replace(
      /\n/g,
      "<br>"
    );

  return safe;

}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTyping(mode = "chat", detail = "DreamForge AI is thinking"){

  removeTyping();
  if(!chat) return;

  const typing = document.createElement("div");
  typing.id = "dfTyping";
  typing.className = "df-message assistant-message " +
    (mode === "image" ? "df-thinking-image" : "df-thinking");

  const title = mode === "image" ? "Creating image" : "Thinking...";
  const sub = detail || (mode === "image" ? "Generating your image..." : "DreamForge AI is preparing a reply");

  typing.innerHTML = `
    <div class="df-avatar">✦</div>
    <div class="df-bubble assistant-bubble">
      <span class="df-thinking-orb" aria-hidden="true"></span>
      <span class="df-thinking-copy">
        <strong>${escapeHTML(title)}</strong>
        <small>${escapeHTML(sub)}</small>
        <span class="df-thinking-wave" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
      </span>
    </div>
  `;

  chat.appendChild(typing);
  scrollChat();
}



function removeTyping(){

  const typing =
    document.getElementById(
      "dfTyping"
    );

  if(typing){
    typing.remove();
  }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
){

  let toast =
    document.getElementById(
      "toast"
    );

  if(!toast){

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "toast";

    toast.style.position =
      "fixed";

    toast.style.left =
      "50%";

    toast.style.bottom =
      "110px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex =
      "99999";

    toast.style.padding =
      "12px 18px";

    toast.style.borderRadius =
      "18px";

    toast.style.background =
      "rgba(30,30,40,.92)";

    toast.style.color =
      "#fff";

    toast.style.fontSize =
      "14px";

    toast.style.backdropFilter =
      "blur(16px)";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.25)";

    toast.style.display =
      "none";

    document.body.appendChild(
      toast
    );

  }

  toast.textContent =
    message;

  toast.style.display =
    "block";

  clearTimeout(
    window.dfToastTimer
  );

  window.dfToastTimer =
    setTimeout(
      () => {

        toast.style.display =
          "none";

      },
      2500
    );

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(title, message){
  showTyping("image", message || "DreamForge AI is generating your image...");
  const typing = document.getElementById("dfTyping");
  if(typing){
    const strong = typing.querySelector(".df-thinking-copy strong");
    const small = typing.querySelector(".df-thinking-copy small");
    if(strong) strong.textContent = title || "Creating image";
    if(small) small.textContent = message || "Generating your image...";
  }
  if(loading) loading.style.display="none";
}

function hideLoading(){

  const typing = document.getElementById("dfTyping");
  if(typing && typing.classList.contains("df-thinking-image")){
    typing.remove();
  }

  if(loading){
    loading.style.display = "none";
  }

}


/* =========================================================
   BUSY
========================================================= */

function setBusy(
  value
){

  isBusy =
    Boolean(value);

  if(generateBtn){
    generateBtn.disabled = false;
    generateBtn.style.opacity = isBusy ? "0.82" : "";
  }

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function showUploadPreview(
  file
){

  if(!previewContainer){
    return;
  }

  if(!file){

    previewContainer.style.display =
      "none";

    if(uploadPreview){

      uploadPreview.removeAttribute(
        "src"
      );

    }

    return;

  }

  const url =
    URL.createObjectURL(
      file
    );

  if(uploadPreview){

    uploadPreview.src =
      url;

  }

  previewContainer.style.display =
    "block";

}


function clearSelectedImage(){

  selectedFile =
    null;

  if(imageInput){

    imageInput.value =
      "";

  }

  if(uploadPreview){

    uploadPreview.removeAttribute(
      "src"
    );

  }

  if(previewContainer){

    previewContainer.style.display =
      "none";

  }

  showToast(
    "Image removed"
  );

}


/* =========================================================
   IMAGE INPUT
========================================================= */

if(imageInput){

  imageInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if(!file){
        return;
      }

      if(
        !file.type.startsWith(
          "image/"
        )
      ){

        showToast(
          "Please select an image"
        );

        imageInput.value =
          "";

        return;

      }

      if(
        file.size >
        20 * 1024 * 1024
      ){

        showToast(
          "Image must be below 20 MB"
        );

        imageInput.value =
          "";

        return;

      }

      selectedFile =
        file;

      showUploadPreview(
        file
      );

      setMode(
        "image"
      );

      showToast(
        "Image selected"
      );

    }
  );

}


/* =========================================================
   ATTACH BUTTON
========================================================= */

if(attachBtn){

  attachBtn.addEventListener(
    "click",
    () => {

      if(imageInput){

        imageInput.click();

      }

    }
  );

}


/* =========================================================
   REMOVE IMAGE
========================================================= */

if(removeImage){

  removeImage.addEventListener(
    "click",
    clearSelectedImage
  );

}


/* =========================================================
   FILE -> DATA URL
========================================================= */

function fileToDataURL(
  file
){

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
          reader.result
        );

      reader.onerror =
        () => reject(
          reader.error
        );

      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   API JSON
========================================================= */

async function readJSON(
  response
){

  const text =
    await response.text();

  let data = null;

  try{

    data =
      text
        ? JSON.parse(text)
        : {};

  }catch(error){

    throw new Error(
      "Server returned invalid response"
    );

  }

  if(!response.ok){

    const message =
      data?.error ||
      data?.message ||
      `HTTP ${response.status}`;

    throw new Error(
      message
    );

  }

  return data;

}


/* =========================================================
   CHAT API
========================================================= */

async function sendChat(message, signal = null, onChunk = null){
  let image = null;
  if(selectedFile) image = await fileToDataURL(selectedFile);

  const payload = {
    message: message || "",
    agent: "default",
    context: Array.isArray(chatHistory)
      ? chatHistory.slice(-8).map(m => ({role:m.role, content:m.content}))
      : []
  };
  if(image) payload.image = image;

  const response = await fetch(CHAT_API, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Accept":"text/event-stream, application/json"
    },
    cache:"no-store",
    body:JSON.stringify(payload),
    signal
  });

  if(!response.ok){
    let message = `HTTP ${response.status}`;
    try{
      const text = await response.text();
      try{
        const json = JSON.parse(text);
        message = json?.error || json?.message || json?.reply || text || message;
      }catch{ message = text || message; }
    }catch{}
    throw new Error(message);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if(contentType.includes("application/json") || !response.body){
    const text = await response.text();
    try{
      const data = JSON.parse(text);
      const reply = data?.reply || data?.response || data?.message || "";
      if(reply && typeof onChunk === "function") onChunk(String(reply), String(reply));
      return {reply:String(reply || "No reply generated."), agent:data?.agent || "default"};
    }catch{
      if(text){ if(typeof onChunk === "function") onChunk(text,text); return {reply:text,agent:"default"}; }
      throw new Error("Server returned invalid response");
    }
  }

  const reader=response.body.getReader();
  const decoder=new TextDecoder("utf-8");
  let buffer="";
  let fullReply="";

  const emit=(chunk)=>{
    if(typeof chunk !== "string" || !chunk) return;
    fullReply += chunk;
    if(typeof onChunk === "function") onChunk(chunk,fullReply);
  };

  const parseLine=(line)=>{
    const trimmed=line.trim();
    if(!trimmed || !trimmed.startsWith("data:")) return;
    const raw=trimmed.slice(5).trim();
    if(!raw || raw === "[DONE]") return;
    try{
      const data=JSON.parse(raw);
      const chunk =
        data?.choices?.[0]?.delta?.content ??
        data?.choices?.[0]?.message?.content ??
        data?.response ??
        data?.result?.response ??
        data?.result?.text ??
        data?.text ??
        data?.token ?? "";
      if(typeof chunk === "string") emit(chunk);
    }catch{
      emit(raw);
    }
  };

  while(true){
    const {value,done}=await reader.read();
    if(done) break;
    buffer += decoder.decode(value,{stream: false});
    const lines=buffer.split(/\r?\n/);
    buffer=lines.pop() || "";
    for(const line of lines) parseLine(line);
  }
  buffer += decoder.decode();
  if(buffer.trim()) parseLine(buffer);

  return {reply:fullReply || "No reply generated.",agent:"default"};
}


/* =========================================================
   CHAT SEND
========================================================= */

let activeChatController = null;

function setChatLoading(loading){

  if(!generateBtn){
    return;
  }

  if(loading){

    generateBtn.innerHTML = `
      <span class="df-send-dots">
        <span></span>
        <span></span>
        <span></span>
      </span>
    `;

    generateBtn.title = "Stop";
    generateBtn.setAttribute("aria-label", "Stop");
    generateBtn.classList.add("df-chat-loading");

  }else{

    generateBtn.innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i>';

    generateBtn.title = "Send";
    generateBtn.setAttribute("aria-label", "Send");
    generateBtn.classList.remove("df-chat-loading");

  }

}

if(!document.getElementById("dfChatLoadingStyle")){

  const style =
    document.createElement("style");

  style.id =
    "dfChatLoadingStyle";

  style.textContent = `
    .df-send-dots{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:3px;
    }

    .df-send-dots span{
      width:5px;
      height:5px;
      border-radius:50%;
      background:currentColor;
      animation:dfSendDots 1s infinite ease-in-out;
    }

    .df-send-dots span:nth-child(2){
      animation-delay:.15s;
    }

    .df-send-dots span:nth-child(3){
      animation-delay:.30s;
    }

    @keyframes dfSendDots{
      0%,60%,100%{
        transform:translateY(0);
        opacity:.35;
      }
      30%{
        transform:translateY(-4px);
        opacity:1;
      }
    }
  `;

  document.head.appendChild(style);

}



function instantGreeting(message){
  const t = String(message || "").trim().toLowerCase().replace(/[!?.,]+$/g, "");
  const greetings = new Set(["hi","hii","hello","hey","helo","namaste","नमस्ते","good morning","good evening","good afternoon","hola","hy","hlo"]);
  if(!greetings.has(t)) return null;
  return "Hello! 👋\n\nMain DreamForge AI hoon. Aapki kya madad kar sakta hoon?\n\nAap mujhse question pooch sakte hain, ideas discuss kar sakte hain, ya image generate/transform kar sakte hain.";
}

async function handleChat(){

  console.log("handleChat called", isBusy);

  if(isBusy) return;

  ...
}

  const message=promptInput ? promptInput.value.trim() : "";
  if(!message && !selectedFile){ showToast("Message ya image add karo"); return; }

  setMode(selectedFile ? "image" : "chat");
  if(message) addUserMessage(message);
  else if(selectedFile) addUserMessage("🖼️ Image uploaded");
  if(promptInput) promptInput.value="";

  setBusy(true);
  const instant=instantGreeting(message);
  if(instant && !selectedFile){
    removeTyping(); addAssistantMessage(instant);
    if(voiceToVoiceActive) speakText(instant);
    setBusy(false); setChatLoading(false); scrollChat(); return;
  }

  // Keep the Thinking UI visible until the first real token arrives.
  showTyping("chat","DreamForge AI is thinking • reading context • preparing a useful answer");
  setChatLoading(true);
  activeChatController=new AbortController();

  let streamedReply="";
  let assistantWrapper=null;
  let assistantBubble=null;
  let assistantStarted=false;
  let streamFrame=null;

  const streamScroll=()=>{
    if(streamFrame || !chat) return;
    streamFrame=requestAnimationFrame(()=>{
      streamFrame=null;
      chat.scrollTo({top:chat.scrollHeight,behavior:"auto"});
    });
  };

  const handleStreamChunk=(chunk,fullText)=>{
    streamedReply=String(fullText ?? chunk ?? "");
    if(!streamedReply) return;

    if(!assistantStarted){
      assistantStarted=true;
      removeTyping();
      assistantWrapper=document.createElement("div");
      assistantWrapper.className="df-message assistant-message df-streaming-message";
      assistantWrapper.innerHTML=`<div class="df-avatar">✦</div><div class="df-assistant-stack"><div class="df-bubble assistant-bubble"></div></div>`;
      assistantBubble=assistantWrapper.querySelector(".assistant-bubble");
      chat.appendChild(assistantWrapper);
    }

    if(assistantBubble) assistantBubble.innerHTML=formatAIText(cleanAssistantReply(streamedReply));
    streamScroll();
  };

  try{
    const data=await sendChat(message,activeChatController.signal,handleStreamChunk);

    if(!assistantStarted){
      const reply=String(data?.reply || data?.response || data?.message || "No reply generated.");
      streamedReply=reply;
      removeTyping();
      addAssistantMessage(reply);
    }else{
      // Save the final streamed answer exactly once; don't duplicate the bubble.
      if(streamedReply) addHistoryMessage("assistant",streamedReply);
      if(assistantWrapper) assistantWrapper.dataset.complete="1";
    }

    if(voiceToVoiceActive && streamedReply) speakText(streamedReply);
  }catch(error){
    removeTyping();
    if(error?.name === "AbortError") addAssistantMessage("⏹️ Response stopped.");
    else{
      console.error("CHAT ERROR:",error);
      addAssistantMessage("⚠️ Chat error: " + error.message);
      showToast("Chat request failed");
    }
  }finally{

  console.log("finally reached");

  if(streamFrame) cancelAnimationFrame(streamFrame);

  activeChatController=null;

  setChatLoading(false);

  setBusy(false);

  scrollChat();
}
}


/* =========================================================
   GENERATE BUTTON
========================================================= */

if(generateBtn){

  generateBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      if(activeChatController){
        activeChatController.abort();
        return;
      }

      handleGenerate();

    }
  );

}


/* =========================================================
   ENTER KEY
========================================================= */

if(promptInput){

  promptInput.addEventListener(
    "keydown",
    event => {

      if(
        event.key === "Enter" &&
        !event.shiftKey
      ){

        event.preventDefault();

        if(
          generateBtn
        ){

          generateBtn.click();

        }

      }

    }
  );

}


/* =========================================================
   GENERATE IMAGE
========================================================= */


async function handleGenerate(){

  if(isBusy){
    return;
  }

  const prompt =
    promptInput
      ? promptInput.value.trim()
      : "";

  if(!prompt){

    showToast(
      "Message likho"
    );

    return;
  }


  /*
    ========================================================
    DREAMFORGE SMART ROUTER

    Normal message:
      -> /chat

    Image request:
      -> /generate

    Attached image:
      -> /generate (image-to-image)
    ========================================================
  */

  const text =
    prompt.toLowerCase().trim();


  const imageWords = [
    "generate image", "generate an image", "generate a image",
    "create image", "create an image", "create a image",
    "make image", "make an image", "make a image",
    "draw image", "text to image", "text-to-image",
    "image bana", "image banao", "image bana do",
    "photo bana", "photo banao", "photo bana do",
    "tasveer bana", "tasveer banao", "चित्र बनाओ", "फोटो बनाओ"
  ];


  const imageRequest =
    Boolean(selectedFile) ||
    imageWords.some(
      word => text.includes(word)
    );


  /*
    ========================================================
    NORMAL CHAT
    ========================================================
  */

  if(!imageRequest){

    /*
      IMPORTANT:
      Chat handler existing code ko use karega.
      Isse Hindi / English / Hinglish messages
      image generator mein nahi jayenge.
    */

    await handleChat();

    return;
  }


  /*
    ========================================================
    IMAGE GENERATION
    ========================================================
  */

  setBusy(
    true
  );


  const isImageToImage =
    Boolean(
      selectedFile
    );


  setMode(
    isImageToImage
      ? "image-to-image"
      : "text-to-image"
  );


  addUserMessage(
    prompt
  );


  if(promptInput){

    promptInput.value =
      "";

  }


  showLoading(

    isImageToImage
      ? "Transforming image..."
      : "Creating image...",

    isImageToImage
      ? "DreamForge image ko transform kar raha hai."
      : "DreamForge AI image generate kar raha hai."

  );


  try{

    const formData =
      new FormData();


    formData.append(
      "prompt",
      prompt
    );


    if(selectedFile){

      formData.append(
        "image",
        selectedFile
      );

    }


    const response =
      await fetch(
        IMAGE_API,
        {
          method:
            "POST",

          body:
            formData
        }
      );


    const data =
      await readJSON(
        response
      );


    /*
      Backend currently returns:
      {
        fallback_url: "...",
        prompt: "..."
      }
    */

    const imageURL =
      extractImageURL(
        data
      );


    if(!imageURL){

      throw new Error(
        "Server ne image URL nahi diya"
      );

    }


    lastGeneratedImage =
      imageURL;


    /*
      Image result
    */

    addAssistantImage(
      imageURL
    );


    showToast(
      isImageToImage
        ? "Image transformed successfully"
        : "Image generated successfully"
    );


  }catch(error){

    console.error(
      "IMAGE GENERATION ERROR:",
      error
    );


    addAssistantMessage(
      "⚠️ Image generation failed: " +
      error.message
    );


    showToast(
      "Image generation failed"
    );


  }finally{

  /*
    IMPORTANT:
    Image generation complete/error hone ke baad
    loading overlay hamesha close hoga.
  */

  hideLoading();

  /*
    Image selection clear karo,
    lekin image-to-image feature remove nahi hoga.
  */

  selectedFile =
    null;


    if(
      imageInput
    ){

      imageInput.value =
        "";

    }


    if(
      previewContainer
    ){

      previewContainer.style.display =
        "none";

    }


    setBusy(
      false
    );

  }

}

/* =========================================================
   EXTRACT IMAGE URL
========================================================= */

function extractImageURL(
  data
){

  if(!data){
    return null;
  }

  const candidates = [

    data.url,

    data.image,

    data.image_url,

    data.imageUrl,

    data.output,

    data.output_url,

    data.outputUrl,

    data.fallback_url,

    data.fallbackUrl,

    data.result?.url,

    data.result?.image,

    data.result?.image_url,

    data.result?.imageUrl,

    data.data?.url,

    data.data?.image,

    data.data?.image_url,

    data.data?.imageUrl

  ];

  for(
    const candidate of candidates
  ){

    if(
      typeof candidate === "string" &&
      candidate.trim()
    ){

      const value =
        candidate.trim();

      if(
        value.startsWith("/9j/")
      ){

        return (
          "data:image/jpeg;base64," +
          value
        );

      }

      if(
        value.startsWith("data:image/")
      ){

        return value;

      }

      if(
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("/")
      ){

        return value;

      }

    }

  }

  if(
    Array.isArray(
      data.output
    )
  ){

    for(
      const item of data.output
    ){

      if(
        typeof item === "string" &&
        item.trim()
      ){

        const value =
          item.trim();

        if(
          value.startsWith("/9j/")
        ){

          return (
            "data:image/jpeg;base64," +
            value
          );

        }

        return value;

      }

      if(
        item &&
        typeof item === "object" &&
        typeof item.url === "string" &&
        item.url.trim()
      ){

        return item.url.trim();

      }

    }

  }

  if(
    Array.isArray(data.images) &&
    data.images.length
  ){

    for(
      const item of data.images
    ){

      if(
        typeof item === "string" &&
        item.trim()
      ){

        const value =
          item.trim();

        if(
          value.startsWith("/9j/")
        ){

          return (
            "data:image/jpeg;base64," +
            value
          );

        }

        return value;

      }

      if(
        item &&
        typeof item.url === "string" &&
        item.url.trim()
      ){

        return item.url.trim();

      }

    }

  }

  return null;

}

/* =========================================================
   ADD GENERATED IMAGE
========================================================= */

function addAssistantImage(
  imageURL
){

  if(!imageURL){
    return;
  }

  addGeneratedImage(
    imageURL,
    ""
  );

}


function addGeneratedImage(
  imageURL,
  prompt
){

  if(!chat){
    return;
  }

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "df-message assistant-message df-image-message";

  wrapper.innerHTML = `

    <div class="df-avatar">
      ✦
    </div>

    <div class="df-bubble assistant-bubble">

      <div class="df-image-card">

        <img
          class="df-generated-image"
          src="${escapeAttribute(imageURL)}"
          alt="DreamForge AI generated image"
          loading="lazy"
        >

        <div class="df-image-actions">

          <button
            type="button"
            class="df-image-action"
            data-action="like"
          >
            ♡
          </button>

          <button
            type="button"
            class="df-image-action"
            data-action="remix"
          >
            ✨
          </button>

          <button
            type="button"
            class="df-image-action"
            data-action="save"
          >
            ♡
          </button>

          <button type="button" class="df-image-action" data-action="share" title="Share">↗</button>
          <button type="button" class="df-image-action" data-action="reply" title="Reply">↩</button>
          <button type="button" class="df-image-action" data-action="download" title="Download">↓</button>

        </div>

      </div>

    </div>
  `;

  const image =
    wrapper.querySelector(
      ".df-generated-image"
    );

  if(image){

    image.addEventListener(
      "error",
      () => {

        image.alt =
          "Generated image could not be loaded";

        image.style.display =
          "none";

        const errorBox =
          document.createElement(
            "div"
          );

        errorBox.style.padding =
          "20px";

        errorBox.textContent =
          "⚠️ Image load failed";

        image.parentElement?.prepend(
          errorBox
        );

      }
    );

  }

  const actions =
    wrapper.querySelectorAll(
      ".df-image-action"
    );

  actions.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const action =
            button.dataset.action;

          if(
            action === "like"
          ){

            button.textContent =
              "♥";

          }

          if(
            action === "save"
          ){

            saveImageURL(
              imageURL
            );

          }

          if(action === "share"){
            if(navigator.share){
              navigator.share({title:"DreamForge AI image",url:imageURL}).catch(()=>{});
            }else{
              navigator.clipboard?.writeText(imageURL);
              showToast("✓ Image link copied");
            }
          }

          if(action === "reply"){
            if(promptInput){ promptInput.value = "Reply about this image"; autoGrowInput(); promptInput.focus(); }
          }

          if(action === "download"){
            downloadImage(imageURL);
          }

          if(
            action === "remix"
          ){

            if(promptInput){

              promptInput.value =
                prompt;

              promptInput.focus();

            }

            showToast(
              "Prompt remix ke liye ready hai"
            );

          }

        }
      );

    }
  );

  chat.appendChild(
    wrapper
  );

  scrollChat();

}


/* =========================================================
   ATTRIBUTE ESCAPE
========================================================= */

function escapeAttribute(
  value
){

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );

}


/* =========================================================
   SAVE IMAGE
========================================================= */

function saveImageURL(
  url
){

  try{

    const saved =
      JSON.parse(
        localStorage.getItem(
          "dreamforge_saved_images"
        ) || "[]"
      );

    if(
      !saved.includes(url)
    ){

      saved.push(url);

    }

    localStorage.setItem(
      "dreamforge_saved_images",
      JSON.stringify(
        saved.slice(-50)
      )
    );

    showToast(
      "Image saved"
    );

  }catch(error){

    console.error(
      error
    );

    showToast(
      "Image save failed"
    );

  }

}


/* =========================================================
   DOWNLOAD IMAGE
========================================================= */

async function downloadImage(
  url
){

  try{

    const response =
      await fetch(
        url
      );

    if(
      !response.ok
    ){

      throw new Error(
        "Image download failed"
      );

    }

    const blob =
      await response.blob();

    const objectURL =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href =
      objectURL;

    a.download =
      "dreamforge-ai.png";

    document.body.appendChild(
      a
    );

    a.click();

    a.remove();

    setTimeout(
      () => {

        URL.revokeObjectURL(
          objectURL
        );

      },
      1000
    );

  }catch(error){

    console.error(
      "Download error:",
      error
    );

    showToast(
      "Download failed"
    );

  }

}


/* =========================================================
   VOICE INPUT
========================================================= */

function initVoiceRecognition(){

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if(!SpeechRecognition){
    console.warn("Speech Recognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = detectVoiceLanguage();
  recognition.onnomatch = () => showToast("🎤 Kuchh samajh nahi aaya, dobara bolo");

  recognition.onstart = () => {
    isListening = true;
    updateVoiceButton(true);

    const live = document.getElementById("dfVoiceLive");
    if(live){
      live.classList.add("active");
      live.setAttribute("aria-hidden","false");
    }

    showToast("🎤 Sun raha hoon...");
  };

  recognition.onresult = event => {

    let finalText = "";
    let interimText = "";

    for(let i = event.resultIndex; i < event.results.length; i++){
      const result = event.results[i];
      const text = result[0]?.transcript || "";

      if(result.isFinal){
        finalText += text;
      }else{
        interimText += text;
      }
    }

    const combined = (finalText || interimText).trim();

    if(promptInput && combined){
      promptInput.value = combined;
      autoGrowInput();
    }

    const liveText = document.querySelector(".df-voice-live-text");
    if(liveText){
      liveText.textContent =
        combined || "Sun raha hoon...";
    }

    if(finalText){
      showToast(voiceToVoiceActive ? "🎙️ Voice message ready" : "Voice text ready");
      if(voiceToVoiceActive && promptInput){
        setTimeout(() => {
          if(promptInput.value.trim() && !isBusy){
            handleChat();
          }
        }, 60);
      }
    }
  };

  recognition.onerror = event => {

    console.error("Speech error:", event.error);

    const live = document.getElementById("dfVoiceLive");
    if(live){
      live.classList.remove("active");
      live.setAttribute("aria-hidden","true");
    }

    if(event.error === "not-allowed" || event.error === "service-not-allowed"){
      showToast("🎤 Microphone permission allow karo");
    }else if(event.error === "audio-capture"){
      showToast("🎤 Microphone available nahi hai");
    }else{
      showToast("Voice input error: " + (event.error || "unknown"));
    }
  };

  recognition.onend = () => {

    isListening = false;
    updateVoiceButton(false);

    const live = document.getElementById("dfVoiceLive");
    if(live){
      live.classList.remove("active");
      live.setAttribute("aria-hidden","true");
    }
  };
}

function detectVoiceLanguage(){

  const value =
    promptInput
      ? promptInput.value
      : "";

  if(
    /[\u0900-\u097F]/.test(
      value
    )
  ){

    return "hi-IN";

  }

  return "en-IN";

}


function updateVoiceButton(
  active
){

  if(!voiceBtn){
    return;
  }

  if(active){

    voiceBtn.classList.add(
      "voice-active"
    );

    voiceBtn.setAttribute(
      "aria-label",
      "Stop voice input"
    );

    voiceBtn.title =
      "Stop voice input";

  }else{

    voiceBtn.classList.remove(
      "voice-active"
    );

    voiceBtn.setAttribute(
      "aria-label",
      "Voice input"
    );

    voiceBtn.title =
      "Voice input";

  }

}


const VOICE_INPUT_KEY = "dreamforge_voice_input_enabled";
const MIC_KEY = "dreamforge_mic_enabled";

function getVoiceInputEnabled(){
  return localStorage.getItem(VOICE_INPUT_KEY) !== "0";
}

function setVoiceInputEnabled(on){
  const enabled = !!on;
  localStorage.setItem(VOICE_INPUT_KEY, enabled ? "1" : "0");
  if(!enabled && recognition && isListening){
    try{ recognition.stop(); }catch(e){}
    isListening = false;
    updateVoiceButton(false);
  }
  if(!enabled) voiceToVoiceActive = false;
}

function getMicEnabled(){
  return localStorage.getItem(MIC_KEY) !== "0";
}

function setMicEnabled(on){
  const enabled = !!on;
  localStorage.setItem(MIC_KEY, enabled ? "1" : "0");
  if(!enabled && recognition && isListening){
    try{ recognition.stop(); }catch(e){}
    isListening = false;
    updateVoiceButton(false);
  }
  if(voiceBtn){
    voiceBtn.classList.toggle("df-mic-disabled", !enabled);
    voiceBtn.setAttribute("aria-disabled", String(!enabled));
    voiceBtn.title = enabled ? "Voice input" : "Microphone is off";
  }
}

/* =========================================================
   VOICE BUTTON
========================================================= */

if(voiceBtn){

  voiceBtn.addEventListener(
    "click",
    async () => {

      if(!getMicEnabled()){
        showToast("🔇 Settings → Microphone ON करें");
        return;
      }

      if(!getVoiceInputEnabled()){
        showToast("🔇 Settings → Voice input ON करें");
        return;
      }

      if(!recognition){
        showToast("Voice input browser me supported nahi hai");
        return;
      }

      if(isListening){
        recognition.stop();
        return;
      }

      recognition.lang = detectVoiceLanguage();

      try{
        // Request permission only when needed. SpeechRecognition itself
        // handles the microphone stream; opening a separate getUserMedia
        // stream can prevent recognition from starting on some Android
        // Chrome/WebView builds.
        recognition.start();
      }catch(error){
        console.warn("Recognition start:", error);
        if(error && error.name === "InvalidStateError"){
          try{ recognition.stop(); }catch(e){}
          setTimeout(()=>{
            if(!isListening && getVoiceInputEnabled()){
              try{ recognition.start(); }catch(e){}
            }
          }, 180);
        }else if(error && error.name === "NotAllowedError"){
          showToast("🎤 Microphone permission allow karo");
        }else{
          showToast("🎤 Mic start nahi hua. Chrome me microphone permission check karo");
        }
      }

    }
  );

}


/* =========================================================
   TEXT TO SPEECH
========================================================= */

function getAutoSpeak(){
  return localStorage.getItem("dreamforge_auto_speak") === "1";
}

function setAutoSpeak(enabled){
  localStorage.setItem("dreamforge_auto_speak", enabled ? "1" : "0");
}
function speakText(
 text
){

  if(
    !("speechSynthesis" in window)
  ){

    return;

  }

  if(!text){
    return;
  }

  try{

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    if(
      /[\u0900-\u097F]/.test(
        text
      )
    ){

      utterance.lang =
        "hi-IN";

    }else{

      utterance.lang =
        "en-IN";

    }

    utterance.rate =
      0.95;

    utterance.pitch =
      1;

    utterance.volume =
      1;

    window.speechSynthesis.speak(
      utterance
    );

  }catch(error){

    console.error(
      "TTS error:",
      error
    );

  }

}


function speakTextIfEnabled(text){
  if(getAutoSpeak() && typeof speakText === "function"){
    speakText(text);
  }
}


/* =========================================================
   VOICE HISTORY
========================================================= */

function addVoiceHistory(
 text,
 role = "assistant"
){

  if(!text){
    return;
  }

  voiceHistory.push({

    id:
      Date.now(),

    role:
      role,

    text:
      text,

    time:
      Date.now()

  });

  if(
    voiceHistory.length >
    50
  ){

    voiceHistory =
      voiceHistory.slice(-50);

  }

  saveVoiceHistory();

}


/* =========================================================
   VOICE TO VOICE - COMING SOON
========================================================= */

async function showVoiceToVoiceComingSoon(){
  voiceToVoiceActive = false;
  if(recognition && isListening){
    try{ recognition.stop(); }catch(e){}
  }
  showToast("🎙️ Voice-to-Voice — Coming Soon");
}



function initVoiceToVoice(){
  voiceToVoiceComingSoon = true;
  voiceToVoiceActive = false;
  const existing = document.getElementById("voiceToVoiceBtn");
  if(existing){
    existing.title = "Voice-to-Voice — Coming Soon";
    existing.setAttribute("aria-label","Voice-to-Voice — Coming Soon");
    existing.classList.add("df-v2v-coming-soon");
  }
}



/* =========================================================
   AUTO GROW INPUT
========================================================= */

function autoGrowInput(){

  if(!promptInput){
    return;
  }

  promptInput.style.height =
    "auto";

  promptInput.style.height =
    Math.min(
      promptInput.scrollHeight,
      140
    ) + "px";

}


if(promptInput){

  promptInput.addEventListener(
    "input",
    autoGrowInput
  );

}

/* =========================================================
   NEW CHAT
========================================================= */

function clearChat(){

  chatHistory =
    [];

  saveHistory();

  if(chat){

    chat.innerHTML =
      "";

  }

  if(welcome){

    welcome.style.display =
      "";

  }

  clearSelectedImage();

  showToast(
    "New chat started"
  );

}


window.newDreamForgeChat =
  clearChat;


/* =========================================================
   MENU
========================================================= */

if(menuBtn){

  menuBtn.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "menu-open"
      );

    }
  );

}


/* =========================================================
   SETTINGS
========================================================= */

if(settingsBtn){

  settingsBtn.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "settings-open"
      );

    }
  );

}


/* =========================================================
   AUTO SPEAK TOGGLE
========================================================= */

window.DreamForgeVoice =
  {

    speak:
      speakText,

    start:
      () => {

        if(recognition){

          recognition.start();

        }

      },

    stop:
      () => {

        if(recognition){

          recognition.stop();

        }

      },

    autoSpeak:
      getAutoSpeak,

    setAutoSpeak:
      setAutoSpeak,

    voiceToVoice:
      showVoiceToVoiceComingSoon

  };


/* =========================================================
   ANIMATIONS
========================================================= */

function initAnimations(){

  const elements =
    document.querySelectorAll(
      "button, .icon-clay, .df-bubble"
    );

  elements.forEach(
    (element, index) => {

      element.style.setProperty(
        "--df-delay",
        `${Math.min(index * 0.03, 1)}s`
      );

    }
  );

}


/* =========================================================
   API HEALTH CHECK
========================================================= */

async function checkBackend(){

  try{

    const response =
      await fetch(
        API_BASE + "/",
        {
          method:
            "GET"
        }
      );

    if(
      response.ok
    ){

      console.log(
        "✅ DreamForge backend connected:",
        API_BASE
      );

      return true;

    }

  }catch(error){

    console.warn(
      "⚠️ DreamForge backend not reachable:",
      API_BASE
    );

  }

  return false;

}


/* =========================================================
   INITIALIZATION
========================================================= */

function initDreamForge(){

  console.log(
    "✨ DreamForge AI Part 3 loaded"
  );

  console.log(
    "API:",
    API_BASE
  );

  console.log(
    "Chat:",
    CHAT_API
  );

  console.log(
    "Image:",
    IMAGE_API
  );

  initVoiceRecognition();

  initVoiceToVoice();

  initAnimations();

  restoreHistory();

  checkBackend();

}


/* =========================================================
   START
========================================================= */

if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initDreamForge
  );

}else{

  initDreamForge();

}


/* =========================================================
   GLOBAL DEBUG / CONTROL
========================================================= */

window.DreamForge =
  {

    API_BASE:
      API_BASE,

    CHAT_API:
      CHAT_API,

    IMAGE_API:
      IMAGE_API,

    getMode:
      () => currentMode,

    getHistory:
      () => chatHistory,

    getVoiceHistory:
      () => voiceHistory,

    clearChat:
      clearChat,

    generate:
      handleGenerate,

    sendChat:
      handleChat,

    speak:
      speakText,

    voiceToVoice:
      showVoiceToVoiceComingSoon

  };


/* =========================================================
   END
========================================================= */


/* =========================================================
   DREAMFORGE UI ENHANCEMENTS
   History folders + ChatGPT-style drawer + settings + V2V input
========================================================= */
(function(){
  const FOLDERS_KEY = v6AccountKey("dreamforge_ai_folders_v1");
  const CONVERSATIONS_KEY = v6AccountKey("dreamforge_ai_conversations_v1");
  const DARK_KEY = "dreamforge_dark_mode";
  const MOTION_KEY = "dreamforge_reduce_motion";
  let activeFolder = "all";
  let activeConversationId = null;

  const $ = id => document.getElementById(id);

  function read(key, fallback){
    try{
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    }catch(e){ return fallback; }
  }
  function write(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
  }

  function folders(){
    let list = read(FOLDERS_KEY, null);
    if(!Array.isArray(list) || !list.length){
      list = [{id:"folder-default", name:"My Chats", createdAt:Date.now()}];
      write(FOLDERS_KEY, list);
    }
    return list;
  }
  function conversations(){
    const list = read(CONVERSATIONS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function titleFromHistory(messages){
    const first = (messages || []).find(m => m && m.role === "user" && m.content);
    const raw = String(first ? first.content : "New chat").replace(/\s+/g," ").trim();
    return raw ? raw.slice(0,48) + (raw.length > 48 ? "…" : "") : "New chat";
  }

  function saveConversationSnapshot(){
    if(!Array.isArray(chatHistory) || !chatHistory.length) return;
    let list = conversations();
    let id = activeConversationId;
    let item = id ? list.find(c => c.id === id) : null;
    if(!item){
      id = "chat-" + Date.now() + "-" + Math.random().toString(36).slice(2,7);
      item = {id, title:titleFromHistory(chatHistory), folderId:folders()[0].id, pinned:false, createdAt:Date.now(), updatedAt:Date.now(), messages:[]};
      list.unshift(item);
      activeConversationId = id;
    }
    item.title = titleFromHistory(chatHistory);
    item.messages = chatHistory.map(m => ({role:m.role, content:m.content, time:m.time || Date.now()}));
    item.updatedAt = Date.now();
    write(CONVERSATIONS_KEY, list.slice(0,80));
  }

  function syncConversation(){
    if(Array.isArray(chatHistory) && chatHistory.length) saveConversationSnapshot();
  }

  function openHistory(){
    closeSettings();
    document.body.classList.add("df-history-open");
    const d = $("dfHistoryDrawer"), b = $("dfHistoryBackdrop");
    if(d) d.setAttribute("aria-hidden","false");
    if(b) b.setAttribute("aria-hidden","false");
    renderHistory();
  }
  function closeHistory(){
    document.body.classList.remove("df-history-open");
    const d = $("dfHistoryDrawer"), b = $("dfHistoryBackdrop");
    if(d) d.setAttribute("aria-hidden","true");
    if(b) b.setAttribute("aria-hidden","true");
  }
  function openSettings(){
    closeHistory();
    document.body.classList.add("df-settings-open");
    const d = $("dfSettingsDrawer"), b = $("dfSettingsBackdrop");
    if(d) d.setAttribute("aria-hidden","false");
    if(b) b.setAttribute("aria-hidden","false");
    syncSettingUI();
  }
  function closeSettings(){
    document.body.classList.remove("df-settings-open");
    const d = $("dfSettingsDrawer"), b = $("dfSettingsBackdrop");
    if(d) d.setAttribute("aria-hidden","true");
    if(b) b.setAttribute("aria-hidden","true");
  }

  function renderFolders(){
    const box = $("dfHistoryFolders");
    if(!box) return;
    const list = conversations();
    const fs = folders();
    const pinnedCount = list.filter(c => c.pinned).length;
    let html = `<div class="df-folder-row ${activeFolder === "all" ? "active" : ""}" data-folder="all"><i class="fa-solid fa-layer-group"></i><span>All chats</span><span class="df-folder-count">${list.length}</span></div>`;
    html += `<div class="df-folder-row ${activeFolder === "pinned" ? "active" : ""}" data-folder="pinned"><i class="fa-solid fa-thumbtack"></i><span>Pinned</span><span class="df-folder-count">${pinnedCount}</span></div>`;
    fs.forEach(f => {
      const count = list.filter(c => c.folderId === f.id).length;
      html += `<div class="df-folder-row ${activeFolder === f.id ? "active" : ""}" data-folder="${escapeAttr(f.id)}"><i class="fa-solid fa-folder"></i><span>${escapeHTML(f.name)}</span><span class="df-folder-count">${count}</span></div>`;
    });
    box.innerHTML = html;
    box.querySelectorAll("[data-folder]").forEach(row => row.addEventListener("click",()=>{activeFolder=row.dataset.folder;renderHistory();}));
  }

  function renderHistory(){
    const listBox = $("dfHistoryList");
    if(!listBox) return;
    renderFolders();
    const q = ($( "dfHistorySearch")?.value || "").trim().toLowerCase();
    let list = conversations();
    if(activeFolder === "pinned") list = list.filter(c=>c.pinned);
    else if(activeFolder !== "all") list = list.filter(c=>c.folderId === activeFolder);
    if(q) list = list.filter(c => String(c.title||"").toLowerCase().includes(q) || (c.messages||[]).some(m=>String(m.content||"").toLowerCase().includes(q)));
    list.sort((a,b)=>(b.pinned-a.pinned) || ((b.updatedAt||0)-(a.updatedAt||0)));
    if(!list.length){listBox.innerHTML=`<div class="df-history-empty"><i class="fa-regular fa-comments"></i><br><br>No chats here yet.</div>`;return;}
    listBox.innerHTML = list.map(c => {
      const folder = folders().find(f=>f.id===c.folderId);
      return `<div class="df-history-item" data-chat-id="${escapeAttr(c.id)}">
        <div class="df-history-main"><div class="df-history-title">${c.pinned?"📌 ":""}${escapeHTML(c.title||"New chat")}</div><div class="df-history-meta">${escapeHTML(folder?.name || "My Chats")}</div></div>
        <div class="df-history-actions">
          <button class="df-history-action" data-action="pin" title="Pin"><i class="fa-solid fa-thumbtack"></i></button>
          <button class="df-history-action" data-action="folder" title="Move to folder"><i class="fa-solid fa-folder"></i></button>
          <button class="df-history-action" data-action="rename" title="Rename"><i class="fa-solid fa-pen"></i></button>
          <button class="df-history-action" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }).join("");
    listBox.querySelectorAll(".df-history-item").forEach(row=>{
      row.addEventListener("click",e=>{
        const btn=e.target.closest("button");
        const id=row.dataset.chatId;
        if(btn){handleHistoryAction(id,btn.dataset.action);return;}
        openConversation(id);
      });
    });
  }

  function handleHistoryAction(id, action){
    const list=conversations();
    const c=list.find(x=>x.id===id); if(!c) return;
    if(action==="pin") c.pinned=!c.pinned;
    if(action==="rename"){
      const name=prompt("Rename chat",c.title||"New chat");
      if(name && name.trim()) c.title=name.trim().slice(0,80);
    }
    if(action==="delete"){
      if(!confirm("Delete this chat?")) return;
      write(CONVERSATIONS_KEY,list.filter(x=>x.id!==id));
      if(activeConversationId===id) activeConversationId=null;
      renderHistory(); return;
    }
    if(action==="folder"){
      const fs=folders();
      const names=fs.map((f,i)=>`${i+1}. ${f.name}`).join("\n");
      const pick=prompt("Move chat to folder:\n"+names, "1");
      const n=Number(pick); if(Number.isInteger(n)&&fs[n-1]) c.folderId=fs[n-1].id;
    }
    write(CONVERSATIONS_KEY,list); renderHistory();
  }

  function openConversation(id){
    const c=conversations().find(x=>x.id===id); if(!c) return;
    activeConversationId=id;
    chatHistory=Array.isArray(c.messages)?c.messages.map(m=>({...m})):[];
    saveHistory();
    if(chat){chat.innerHTML="";}
    if(welcome) welcome.style.display="none";
    if(typeof restoreHistory === "function") restoreHistory();
    closeHistory();
    if(typeof scrollChat === "function") scrollChat();
  }

  function createFolder(){
    const name=prompt("Folder name", "New folder");
    if(!name || !name.trim()) return;
    const fs=folders();
    fs.push({id:"folder-"+Date.now(),name:name.trim().slice(0,40),createdAt:Date.now()});
    write(FOLDERS_KEY,fs); activeFolder=fs[fs.length-1].id; renderHistory();
  }

  function newChat(){
    if(Array.isArray(chatHistory)&&chatHistory.length) saveConversationSnapshot();
    activeConversationId=null;
    if(typeof clearChat === "function") clearChat();
    closeHistory(); renderHistory();
  }

  function setToggle(id,on){
    const el=$(id); if(!el)return;
    el.classList.toggle("df-on",!!on);
    el.setAttribute("aria-checked",String(!!on));
  }

  function syncSettingUI(){
    setToggle("dfDarkModeToggle",document.body.classList.contains("dark-mode"));
    setToggle("dfReduceMotionToggle",localStorage.getItem(MOTION_KEY)==="1");
    setToggle("dfVoiceInputToggle",getVoiceInputEnabled());
    setToggle("dfMicToggle",getMicEnabled());
    setToggle("dfAutoSpeakToggle",getAutoSpeak());
  }

  function toggleDark(){
    const on=!document.body.classList.contains("dark-mode");
    document.body.classList.toggle("dark-mode",on);
    localStorage.setItem(DARK_KEY,on?"1":"0");
    syncSettingUI();
  }

  function toggleMotion(){
    const on=localStorage.getItem(MOTION_KEY)!=="1";
    localStorage.setItem(MOTION_KEY,on?"1":"0");
    document.body.classList.toggle("df-reduce-motion",on);
    syncSettingUI();
  }

  function initSettingsState(){
    const dark=localStorage.getItem(DARK_KEY)==="1";
    const motion=localStorage.getItem(MOTION_KEY)==="1";
    document.body.classList.toggle("dark-mode",dark);
    document.body.classList.toggle("df-reduce-motion",motion);
    if(localStorage.getItem(VOICE_INPUT_KEY)===null) setVoiceInputEnabled(true);
    if(localStorage.getItem(MIC_KEY)===null) setMicEnabled(true);
    if(localStorage.getItem("dreamforge_auto_speak")===null) setAutoSpeak(false);
    setVoiceInputEnabled(getVoiceInputEnabled());
    setMicEnabled(getMicEnabled());
    syncSettingUI();
  }

  function saveSettings(){
    syncSettingUI();
    showToast("✓ DreamForge settings saved");
  }

  function sendFeedback(){
    const subject=encodeURIComponent("DreamForge AI Feedback");
    const body=encodeURIComponent(
      "Hello DreamForge AI Team,\n\nFeedback: \n\nDevice/Browser: " + navigator.userAgent + "\n\nThank you."
    );
    window.location.href="mailto:dreamforgeaihelp@gmail.com?subject="+subject+"&body="+body;
  }

  function clearAllHistory(){
    if(!confirm("Delete all saved chat history and folders?")) return;
    chatHistory=[]; saveHistory(); activeConversationId=null;
    write(CONVERSATIONS_KEY,[]); write(FOLDERS_KEY,[{id:"folder-default",name:"My Chats",createdAt:Date.now()}]);
    if(chat) chat.innerHTML=""; if(welcome) welcome.style.display=""; renderHistory();
    showToast("History cleared");
  }
  function logout(){
    ["token","authToken","accessToken","user","userToken","dreamforge_user","dreamforge_session","dreamforge_google_session_v1"].forEach(k=>localStorage.removeItem(k));
    showToast("Logged out");
    setTimeout(()=>{window.location.href="login.html";},350);
  }
  function escapeAttr(v){return String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  function initEnhancements(){
    // History button takes over the old slider-menu behavior.
    if(menuBtn) menuBtn.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();openHistory();},true);
    if(settingsBtn) settingsBtn.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();openSettings();},true);
    $("dfHistoryClose")?.addEventListener("click",closeHistory);
    $("dfHistoryBackdrop")?.addEventListener("click",closeHistory);
    $("dfSettingsClose")?.addEventListener("click",closeSettings);
    $("dfSettingsBackdrop")?.addEventListener("click",closeSettings);
    $("dfNewChatBtn")?.addEventListener("click",newChat);
    $("dfNewFolderBtn")?.addEventListener("click",createFolder);
    $("dfHistorySearch")?.addEventListener("input",renderHistory);
    $("dfDarkModeToggle")?.addEventListener("click",toggleDark);
    $("dfAutoSpeakToggle")?.addEventListener("click",()=>{
      setAutoSpeak(!getAutoSpeak());
      syncSettingUI();
      showToast(getAutoSpeak()?"🔊 Auto speak on":"🔇 Auto speak off");
    });
    $("dfReduceMotionToggle")?.addEventListener("click",toggleMotion);
    $("dfVoiceInputToggle")?.addEventListener("click",(e)=>{
      e.preventDefault(); e.stopPropagation();
      setVoiceInputEnabled(!getVoiceInputEnabled());
      syncSettingUI();
      showToast(getVoiceInputEnabled()?"🎤 Voice input on":"🔇 Voice input off");
    });
    $("dfMicToggle")?.addEventListener("click",(e)=>{
      e.preventDefault(); e.stopPropagation();
      setMicEnabled(!getMicEnabled());
      syncSettingUI();
      showToast(getMicEnabled()?"🎙️ Microphone on":"🔇 Microphone off");
    });
    $("dfSaveSettingsBtn")?.addEventListener("click",saveSettings);
    $("dfFeedbackBtn")?.addEventListener("click",sendFeedback);
    $("dfClearHistoryBtn")?.addEventListener("click",clearAllHistory);
    $("dfLogoutBtn")?.addEventListener("click",logout);
    const v2vHeader = $("voiceToVoiceBtn");
    if(v2vHeader){
      v2vHeader.addEventListener("click",showVoiceToVoiceComingSoon);
    }
    initSettingsState();
    if(typeof applyDreamForgeProfile === "function") applyDreamForgeProfile();

    // Keep conversation snapshots updated without changing the working chat engine.
    const originalAddHistoryMessage = addHistoryMessage;
    addHistoryMessage = function(role,content){
      const result=originalAddHistoryMessage(role,content);
      if(role==="user" && (!activeConversationId || !conversations().some(c=>c.id===activeConversationId))){
        activeConversationId=null;
      }
      syncConversation();
      renderHistory();
      return result;
    };

    const originalClearChat = clearChat;
    clearChat = function(){
      if(Array.isArray(chatHistory)&&chatHistory.length) saveConversationSnapshot();
      activeConversationId=null;
      return originalClearChat();
    };

    syncConversation();
    renderHistory();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",initEnhancements,{once:true});
  else initEnhancements();

/* =========================================================
   GOOGLE SESSION HELPERS
========================================================= */
function getDreamForgeGoogleSession(){
  try{
    return JSON.parse(localStorage.getItem("dreamforge_google_session_v1") || "null");
  }catch(_){
    return null;
  }
}

function applyDreamForgeProfile(){
  const user = getDreamForgeGoogleSession();
  if(!user) return;

  document.body.dataset.googleEmail = user.email || "";
  document.body.dataset.googleName = user.name || "";
}

})();


/* =========================================================
   DREAMFORGE V6 — ACCOUNT SYNC + PREMIUM + FUTURE UX
========================================================= */
(function(){
  const session=()=>getV6Session();
  const token=()=>session()?.v6Token || "";
  const cloudEnabled=()=>!!token();
  let cloudBusy=false;

  async function cloudFetch(path, options={}){
    if(!cloudEnabled()) return null;
    const headers=Object.assign({"Content-Type":"application/json","Authorization":"Bearer "+token()}, options.headers||{});
    const r=await fetch(API_BASE+path,{...options,headers,cache:"no-store"});
    if(!r.ok) throw new Error("Cloud sync HTTP "+r.status);
    return r.json();
  }

  async function pullCloudHistory(){
    if(!cloudEnabled() || cloudBusy) return;
    cloudBusy=true;
    try{
      const data=await cloudFetch("/v6/history");
      const list=Array.isArray(data?.conversations)?data.conversations:[];
      if(list.length){
        localStorage.setItem(v6AccountKey("dreamforge_ai_conversations_v1"),JSON.stringify(list));
        // Use the newest conversation as the working chat only when current chat is empty.
        if(typeof chat !== "undefined" && chat && !chat.children.length){
          const newest=[...list].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
          if(newest?.messages?.length){
            try{ localStorage.setItem(v6AccountKey("dreamforge_ai_chat_history_v1"),JSON.stringify(newest.messages)); }catch(_){ }
            location.reload();
            return;
          }
        }
      }
    }catch(e){ console.info("V6 cloud history fallback:",e.message); }
    finally{ cloudBusy=false; }
  }

  async function pushCloudHistory(){
    if(!cloudEnabled() || cloudBusy) return;
    try{
      const raw=localStorage.getItem(v6AccountKey("dreamforge_ai_conversations_v1"));
      const conversations=raw?JSON.parse(raw):[];
      await cloudFetch("/v6/history",{method:"PUT",body:JSON.stringify({conversations})});
    }catch(e){ console.info("V6 cloud save fallback:",e.message); }
  }

  // Expose small account controls to the UI.
  window.DreamForgeV6={
    session,
    cloudEnabled,
    pullCloudHistory,
    pushCloudHistory,
    logout:()=>{
      localStorage.removeItem("dreamforge_google_session_v1");
      location.href="login.html";
    }
  };

  function addV6UI(){
    const user=session();
    if(!user) return;

    // Account pill
    const header=document.querySelector(".header");
    if(header && !document.getElementById("dfV6Account")){
      const el=document.createElement("button");
      el.id="dfV6Account"; el.className="df-v6-account"; el.type="button";
      el.title=user.email||"Account";
      el.innerHTML=`<img src="${String(user.picture||"").replace(/"/g,"&quot;")}" alt="" onerror="this.style.display='none'"><span>${escapeHTML(String(user.name||user.email||"Account").slice(0,18))}</span>`;
      header.appendChild(el);
    }

  }

  // Pull account history after the base V5 initialization has rendered.
  const boot=()=>{ addV6UI(); setTimeout(pullCloudHistory,250); setInterval(pushCloudHistory,5000); };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
})();
