require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: "*", methods: ["GET","POST","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN;
const SERP_API = process.env.SERP_API_KEY || ""; // optional for web search

if(!ACCOUNT_ID ||!API_TOKEN) console.warn("⚠️ CF keys missing in.env");

app.get("/", (req,res)=>{
  res.json({ status:"DreamForge AI 3D Running ✅", endpoints:["/chat","/generate","/upload","/websearch","/memory"], time:new Date().toISOString() });
});

// ========== CHAT - TEXT + IMAGE + FILE CONTEXT ==========
app.post("/chat", async (req,res)=>{
  try{
    const { message, image, agent, context = [] } = req.body;
    if(!message &&!image) return res.status(400).json({ error:"Message required" });

    let cfUrl, cfPayload;

    // Agent based system prompts
    const systemPrompts = {
      coder: "You are elite full-stack coder. Give production-ready code, explain in Hinglish, add comments. You are DreamForge AI Coder Agent.",
      writer: "You are creative writer, storyteller, shayar. Write emotional, viral content. Hinglish allowed. You are DreamForge Writer Agent.",
      designer: "You are UI/UX + 3D designer. Give design system, color palette, prompt for image generation. You are Designer Agent.",
      research: "You are research analyst. Give structured research with headings, bullet points, sources-like format. You are Research Agent.",
      web: "You are web search expert. Give latest answer with points. If date needed, mention you searched web. You are Web Search Agent.",
      image: "You are image prompt expert. Convert user idea into detailed prompt for FLUX image model.",
      default: "You are DreamForge AI - 3D Glass Edition. Build Dreams. Forge Intelligence. Be friendly, helpful, concise, ChatGPT style. Reply in SAME language as user. If Hindi, use Hinglish. Support 3D UI."
    };
    const sys = systemPrompts[agent] || systemPrompts.default;

    if(image){
      cfUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`;
      cfPayload = {
        prompt: `${sys}\n\nUser query: ${message || "Describe image"}`,
        image: (image.includes(",")? image.split(",")[1]: image).slice(0, 4000000)
      };
    } else {
      cfUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
      // Keep context short for speed
      let userMsg = message;
      if(userMsg.length > 12000) userMsg = userMsg.slice(0,12000) + "\n...[truncated]";
      cfPayload = {
        messages: [
          { role:"system", content: sys },
          ...Array.isArray(context)
            ? context.slice(-8).filter(m => m && (m.role === "user" || m.role === "assistant"))
            : [],
          { role:"user", content: userMsg }
        ],
        max_tokens: 256,
        temperature: 0.3,
        stream: true
      };
    }

    const cf = await axios.post(cfUrl, cfPayload, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      timeout: 20000,
      responseType: "stream"
    });

    let buffer = "";
    let reply = "";

    cf.data.setEncoding("utf8");

    cf.data.on("data", chunk => {
      buffer += chunk;

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;

        try {
          const obj = JSON.parse(raw);

          const text =
            obj.choices?.[0]?.delta?.content ??
            obj.choices?.[0]?.message?.content ??
            obj.response ??
            "";

          if (typeof text === "string") reply += text;
        } catch (_) {
          // Ignore incomplete SSE JSON chunks
        }
      }
    });

    await new Promise((resolve, reject) => {
      cf.data.on("end", resolve);
      cf.data.on("error", reject);
    });

    if (!reply.trim()) {
      reply = "No reply generated.";
    }

    return res.json({
      reply: reply.trim(),
      agent: agent || "default"
    });

  }catch(err){
    console.error("CHAT ERR:", err.response?.data || err.message);
    let msg = err.response?.data?.errors?.[0]?.message || err.message;
    res.status(500).json({ error: msg || "Chat failed", reply: "⚠️ Server cold start ho raha hai, 20 sec me retry karo." });
  }
});

// ========== IMAGE GENERATION - FLUX ==========
app.post("/generate", upload.single("image"), async (req,res)=>{
  try{
    const prompt = req.body.prompt || req.body.message;
    if(!prompt) return res.status(400).json({ error:"Prompt required" });

    // Try Cloudflare Flux
    try{
      const cf = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        { prompt: prompt, steps: 6 },
        { headers:{ Authorization:`Bearer ${API_TOKEN}` }, timeout:90000, responseType:"arraybuffer" }
      );
      res.setHeader("Content-Type","image/png");
      return res.send(Buffer.from(cf.data));
    }catch(e){
      console.log("Flux fail, fallback to pollinations:", e.message);
      // Fallback redirect to pollinations (frontend will use it)
      return res.status(200).json({ fallback_url: `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true`, prompt });
    }

  }catch(err){
    console.error("GEN ERR:", err.message);
    res.status(500).json({ error: "Image gen failed" });
  }
});

// ========== FILE UPLOAD - PDF/DOCX/XLSX EXTRACT ==========
app.post("/upload", upload.single("file"), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({ error:"File required" });
    const f = req.file;
    const ext = path.extname(f.originalname).toLowerCase();
    let text = "";
    let type = "unknown";

    if(f.mimetype.includes("pdf")){
      // Basic PDF text extraction (without pdf-parse to keep lightweight)
      // We'll send buffer to LLM for extraction via llava not ideal, so return info
      text = `[PDF File: ${f.originalname}, Size: ${(f.size/1024).toFixed(1)}KB. Content is binary - frontend will send extracted text if possible]`;
      type = "pdf";
    } else if(ext===".docx" || ext===".doc"){
      text = `[DOCX File: ${f.originalname}, Size: ${(f.size/1024).toFixed(1)}KB]`;
      type = "docx";
    } else if(ext===".xlsx" || ext===".xls"){
      text = `[Excel File: ${f.originalname}, Size: ${(f.size/1024).toFixed(1)}KB]`;
      type = "excel";
    } else if(f.mimetype.startsWith("text/") || ext===".txt" || ext===".csv"){
      text = f.buffer.toString("utf-8").slice(0,15000);
      type = "text";
    } else if(f.mimetype.startsWith("image/")){
      text = `[Image File: ${f.originalname}]`;
      type = "image";
    }

    res.json({
      filename: f.originalname,
      size: f.size,
      type,
      preview_text: text.slice(0,5000),
      message: "File uploaded, now send to /chat with extracted text"
    });

  }catch(err){
    console.error("UPLOAD ERR:", err.message);
    res.status(500).json({ error:"Upload failed" });
  }
});

// ========== WEB SEARCH ==========
app.post("/websearch", async (req,res)=>{
  try{
    const { query } = req.body;
    if(!query) return res.status(400).json({ error:"Query required" });

    // If SERP API key available, use it else fake with LLM knowledge
    if(SERP_API){
      const sr = await axios.get(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API}`);
      const results = sr.data.organic_results?.slice(0,5).map(r=>({title:r.title, link:r.link, snippet:r.snippet})) || [];
      return res.json({ query, results, source:"serpapi" });
    } else {
      // LLM based web search simulation
      const cf = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        { messages:[{role:"system",content:"You are web search engine. Answer with latest info up to 2026. Give 5 bullet points with sources like [1] example.com"},{role:"user",content:`Web search: ${query}`}] },
        { headers:{Authorization:`Bearer ${API_TOKEN}`}, timeout:40000 }
      );
      const ans = cf.data.result?.response || "No result";
      return res.json({ query, answer: ans, results:[], source:"llm" });
    }

  }catch(err){
    console.error("WEBSEARCH ERR:", err.message);
    res.status(500).json({ error:"Web search failed", answer:"Web search unavailable, but I can answer from knowledge." });
  }
});

// ========== MEMORY ENDPOINT ==========
let memoryStore = [];
app.get("/memory", (req,res)=>{ res.json({ count: memoryStore.length, memory: memoryStore.slice(-50) }) });
app.post("/memory", (req,res)=>{
  const { prompt, reply } = req.body;
  if(prompt && reply){
    memoryStore.push({ prompt, reply, time: Date.now() });
    if(memoryStore.length>200) memoryStore.shift();
  }
  res.json({ saved:true, count: memoryStore.length });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=>{ console.log(`✅ DreamForge 3D Server on ${PORT}`); console.log(`✅ /chat 💬`); console.log(`✅ /generate 🖼️`); console.log(`✅ /upload 📄 PDF/DOCX/Excel`); console.log(`✅ /websearch 🌐`); console.log(`✅ /memory 🧠`); });
