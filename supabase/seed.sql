-- ============================================================
-- NEXUS AI Hub — Seed Data
-- Creates a demo organization with all 108 assets
-- Run AFTER 001_initial_schema.sql
-- Usage: psql $DATABASE_URL -f supabase/seed.sql
-- ============================================================

-- Create demo org
insert into organizations (id, name, slug, plan)
values (
  'a0000000-0000-0000-0000-000000000001',
  'O''Neill Contractors',
  'oneill-contractors',
  'pro'
) on conflict (slug) do nothing;

-- NOTE: Profiles are auto-created via handle_new_user() trigger.
-- After signing up, run this to link your user to the demo org:
--
-- update profiles
-- set org_id = 'a0000000-0000-0000-0000-000000000001', role = 'admin'
-- where id = '<your-auth-uid>';

-- Seed assets (org_id scoped)
-- Uses a do block so we can reference the org_id variable cleanly
do $$
declare
  oid uuid := 'a0000000-0000-0000-0000-000000000001';
begin

insert into assets (org_id, name, category, priority, stage, fit) values
-- RAG / Pipeline
(oid,'agentic_rag','RAG / Pipeline','HIGH','BACKLOG','Core doc Q&A — COI, SOV, contract review'),
(oid,'agentic_rag_deepseek','RAG / Pipeline','HIGH','BACKLOG','Enterprise RAG over complex docs — contracts, submittals'),
(oid,'document-chat-rag','RAG / Pipeline','HIGH','BACKLOG','Direct fit: chat with bid docs, lien waivers'),
(oid,'corrective-rag','RAG / Pipeline','HIGH','BACKLOG','Self-correcting RAG — critical for compliance docs'),
(oid,'trustworthy-rag','RAG / Pipeline','HIGH','BACKLOG','Accuracy verification layer for cost backup'),
(oid,'deploy-agentic-rag','RAG / Pipeline','HIGH','BACKLOG','Private agentic RAG API — sovereign deployment'),
(oid,'mcp-agentic-rag','RAG / Pipeline','HIGH','BACKLOG','MCP-powered RAG — direct NEXUS integration'),
(oid,'mcp-agentic-rag-firecrawl','RAG / Pipeline','HIGH','BACKLOG','MCP RAG + web scraping — spec retrieval'),
(oid,'context-engineering-pipeline','RAG / Pipeline','HIGH','BACKLOG','Multi-source context management for agents'),
(oid,'context-engineering-workflow','RAG / Pipeline','HIGH','BACKLOG','Multi-agent research pipeline — Pre-Con intel'),
(oid,'colbert-rag','RAG / Pipeline','HIGH','BACKLOG','High-accuracy retrieval — contract clause search'),
(oid,'fastest-rag-milvus-groq','RAG / Pipeline','HIGH','BACKLOG','Sub-15ms retrieval — real-time bid queries'),
(oid,'fastest-rag-stack','RAG / Pipeline','HIGH','BACKLOG','Speed-optimized RAG for field-facing tools'),
(oid,'modernbert-rag','RAG / Pipeline','MED','BACKLOG','Modern embedding model for RAG'),
(oid,'llama-4-rag','RAG / Pipeline','MED','BACKLOG','Llama 4 RAG — compare vs current stack'),
(oid,'llama-4_vs_deepseek-r1','RAG / Pipeline','MED','BACKLOG','Model comparison harness for RAG'),
(oid,'qwen3_vs_deepseek-r1','RAG / Pipeline','MED','BACKLOG','Reasoning model benchmarking tool'),
(oid,'rag-sql-router','RAG / Pipeline','HIGH','BACKLOG','SQL + RAG routing — SOV / job cost queries'),
(oid,'rag-with-dockling','RAG / Pipeline','MED','BACKLOG','Document parsing pipeline'),
(oid,'simple-rag-workflow','RAG / Pipeline','LOW','BACKLOG','Basic RAG starter template'),
(oid,'github-rag','RAG / Pipeline','LOW','BACKLOG','Chat with code repos'),
(oid,'firecrawl-agent','RAG / Pipeline','MED','BACKLOG','Web-augmented RAG for spec research'),
(oid,'groundX-doc-pipeline','RAG / Pipeline','HIGH','BACKLOG','World-class doc parsing — tables, figures, dense text'),
-- MCP
(oid,'eyelevel-mcp-rag','MCP','HIGH','BACKLOG','MCP RAG server for complex docs — submittals, RFIs'),
(oid,'mcp-voice-agent','MCP','HIGH','BACKLOG','Voice-enabled MCP agent — field use'),
(oid,'audio-analysis-toolkit','MCP','MED','BACKLOG','Audio transcription + RAG — meeting notes'),
(oid,'graphiti-mcp','MCP','HIGH','BACKLOG','Persistent graph memory — subcontractor context'),
(oid,'cursor_linkup_mcp','MCP','MED','BACKLOG','Custom MCP + deep web search + LlamaIndex'),
(oid,'llamaindex-mcp','MCP','HIGH','BACKLOG','LlamaIndex MCP server — NEXUS integration'),
(oid,'ultimate-ai-assitant-using-mcp','MCP','HIGH','BACKLOG','Full MCP assistant orchestration pattern'),
(oid,'Multi-Agent-deep-researcher-mcp','MCP','HIGH','BACKLOG','MCP multi-agent research — Pre-Con, bidding intel'),
(oid,'agent-with-mcp-memory','MCP','HIGH','BACKLOG','Open-source agent stack with MCP memory'),
(oid,'amazon-product-analysis-server','MCP','LOW','BACKLOG','Product analysis MCP — procurement reference'),
(oid,'kitops-mcp','MCP','LOW','BACKLOG','ML model registry MCP'),
(oid,'pixeltable-mcp','MCP','MED','BACKLOG','Multimodal data pipeline MCP'),
(oid,'sdv-mcp','MCP','LOW','BACKLOG','Synthetic data MCP'),
(oid,'mindsdb-mcp','MCP','MED','BACKLOG','DB-connected AI MCP'),
(oid,'art_mcp_rl','MCP','MED','BACKLOG','RL training for MCP tool use'),
(oid,'stagehand-mcp-use','MCP','MED','BACKLOG','Browser automation + MCP'),
-- Agentic
(oid,'database-memory-agent','Agentic','HIGH','BACKLOG','MongoDB + vector search — subcontractor DB'),
(oid,'financial-analyst-deepseek','Agentic','HIGH','BACKLOG','MCP financial analyst — cost analysis'),
(oid,'paralegal-agent-crew','Agentic','HIGH','BACKLOG','Contract/legal doc analysis — lien waiver, T&Cs'),
(oid,'multi-modal-rag','Agentic','HIGH','BACKLOG','Multimodal RAG — blueprint + spec queries'),
(oid,'multimodal-rag-assemblyai','Agentic','MED','BACKLOG','Audio + doc multimodal RAG'),
(oid,'acp-code','Agentic','HIGH','BACKLOG','ACP cross-framework — CrewAI + Smolagents'),
(oid,'agent2agent-demo','Agentic','HIGH','BACKLOG','Agent-to-agent protocol demo'),
(oid,'open-agent-builder','Agentic','HIGH','BACKLOG','Composio-powered agent builder'),
(oid,'multiplatform_deep_researcher','Agentic','MED','BACKLOG','Multi-platform research agent'),
(oid,'autogen-stock-analyst','Agentic','MED','BACKLOG','AutoGen multi-agent — adapt for cost'),
(oid,'sales-analytics-agent','Agentic','MED','BACKLOG','Sales analytics — CRM/IRM fit'),
(oid,'stock-portfolio-analysis-agent','Agentic','LOW','BACKLOG','Financial agent pattern'),
(oid,'zep-memory-assistant','Agentic','HIGH','BACKLOG','Zep long-term memory for sub agents'),
(oid,'ai-avatar-demo','Agentic','LOW','BACKLOG','Conversational avatar — client-facing'),
(oid,'hotel-booking-crew','Agentic','LOW','BACKLOG','Multi-agent crew orchestration pattern'),
(oid,'flight-booking-crew','Agentic','LOW','BACKLOG','CrewAI multi-agent pattern'),
(oid,'openai-swarm-ollama','Agentic','MED','BACKLOG','Swarm pattern with local Ollama — sovereign'),
(oid,'parlant-conversational-agent','Agentic','MED','BACKLOG','Structured conversational — client intake'),
-- Eval
(oid,'eval-and-observability','Eval','HIGH','BACKLOG','E2E eval + observability for RAG'),
(oid,'code-model-comparison','Eval','MED','BACKLOG','Code model benchmarking'),
(oid,'gpt-oss-vs-qwen3','Eval','MED','BACKLOG','Reasoning model comparison harness'),
(oid,'guidelines-vs-traditional-prompt','Eval','MED','BACKLOG','Prompt strategy benchmarking'),
(oid,'o3-vs-claude-code','Eval','MED','BACKLOG','Claude Code vs o3 benchmark'),
(oid,'sonnet4-vs-o4','Eval','MED','BACKLOG','Sonnet 4 vs o4 benchmarking'),
(oid,'sonnet4-vs-qwen3-coder','Eval','MED','BACKLOG','Code model benchmark — informs stack'),
(oid,'minimaxm2-vs-sonnet4-5-vs-kimik2-vs-gemini3','Eval','MED','BACKLOG','Multi-model benchmark'),
-- LLM
(oid,'LaTeX-OCR-with-Llama','LLM','HIGH','BACKLOG','OCR for drawings, invoices, blueprints'),
(oid,'gemma3-ocr','LLM','HIGH','BACKLOG','Local OCR — 100% sovereign'),
(oid,'llama-ocr','LLM','HIGH','BACKLOG','Llama OCR — scan-to-data extraction'),
(oid,'qwen-2.5VL-ocr','LLM','HIGH','BACKLOG','Qwen vision OCR — strong on tables'),
(oid,'deepseek-multimodal-RAG','LLM','HIGH','BACKLOG','Multimodal RAG — drawing + doc'),
(oid,'Colivara-deepseek-website-RAG','LLM','MED','BACKLOG','Multimodal website RAG'),
(oid,'imagegen-janus-pro','LLM','LOW','BACKLOG','Local image gen + multimodal QA'),
(oid,'Build-reasoning-model','LLM','MED','BACKLOG','Build DeepSeek-R1-style — Unsloth'),
(oid,'DeepSeek-finetuning','LLM','MED','BACKLOG','Fine-tune on construction domain data'),
(oid,'knowledge-distillation','LLM','MED','BACKLOG','Compress models for edge/local deploy'),
(oid,'siamese-network','LLM','LOW','BACKLOG','Similarity — duplicate doc detection'),
(oid,'train-yolo26-object-detection','LLM','HIGH','BACKLOG','YOLO — site safety, CV module'),
-- Utility
(oid,'local-chatgpt','Utility','LOW','BACKLOG','Local ChatGPT template'),
(oid,'local-chatgpt-deepseek','Utility','LOW','BACKLOG','DeepSeek local chat UI'),
(oid,'local-chatgpt-gemma3','Utility','LOW','BACKLOG','Gemma 3 local chat UI'),
(oid,'deepseek-thinking-ui','Utility','LOW','BACKLOG','Thinking UI — reasoning trace display'),
(oid,'qwen3-thinking-ui','Utility','LOW','BACKLOG','Qwen3 thinking UI'),
(oid,'gpt-oss-thinking-ui','Utility','LOW','BACKLOG','GPT-OSS thinking UI'),
(oid,'streaming-ai-chatbot','Utility','LOW','BACKLOG','Streaming chatbot template'),
(oid,'notebook-lm-clone','Utility','MED','BACKLOG','NotebookLM clone — doc research'),
(oid,'real-time-voicebot','Utility','MED','BACKLOG','Real-time voice bot — field assistant'),
(oid,'rag-voice-agent','Utility','MED','BACKLOG','RAG + voice — hands-free field queries'),
(oid,'mcp-video-rag','Utility','LOW','BACKLOG','Video RAG — safety training content'),
(oid,'video-rag-gemini','Utility','LOW','BACKLOG','Video RAG with Gemini'),
(oid,'chat-with-audios','Utility','LOW','BACKLOG','Audio RAG'),
(oid,'chat-with-code','Utility','MED','BACKLOG','Chat with GitHub repos — code Q&A'),
(oid,'documentation-writer-flow','Utility','MED','BACKLOG','Auto-doc generator — spec writing'),
(oid,'multilingual-meeting-notes','Utility','MED','BACKLOG','Meeting notes — field + PM use'),
(oid,'Website-to-API-FireCrawl','Utility','MED','BACKLOG','Scrape supplier/spec sites to API'),
(oid,'web-browsing-agent','Utility','MED','BACKLOG','Permit research, supplier lookup'),
(oid,'openclaw-secure-deployment','Utility','MED','BACKLOG','Secure deployment guide'),
(oid,'hugging-face-skills','Utility','MED','BACKLOG','HF Skills — agent capability defs');

end $$;
