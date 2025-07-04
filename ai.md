Gemini 2.5 Pro 接入指南 + AI 集成提案
(面向开发者与评委：既能 1-click 演示，又能平滑迁移到 HSBC 私域)

1 | API 开通 & 凭据配置
步骤	操作要点	产出
1-1 创建 GCP 项目	console.cloud.google.com → “New Project” (名称 polyfintech-ai)	PROJECT_ID
1-2 启用 Vertex AI	① 侧边栏 Vertex AI → Enable ② 选区 asia-southeast1	区域符合 SG 数据合规
1-3 申请 Gemini API 配额	Vertex AI → Generative AI Studio → Models → 选择 Gemini 2.5 Pro (preview) → “Request quota”	24 h 内获批
1-4 创建服务账号	IAM → Service Accounts → “vertex-sa” (仅 Vertex AI 访问)	SA_EMAIL
1-5 生成 JSON Key	同页 Keys → Add Key → JSON	vertex_key.json
1-6 环境变量	.env: GOOGLE_APPLICATION_CREDENTIALS=./keys/vertex_key.json
GCP_PROJECT=polyfintech-ai
GEMINI_LOCATION=asia-southeast1	本地 / CI 均读取

🔒 安全提醒：vertex_key.json 加入 .gitignore，CI 用 GitHub Secrets 挂载。

2 | 集成架构（无代码示意）
pgsql
复制
编辑
                         ┌────────────────────────────────┐
           Large Docs    │ Vertex AI  /models/gemini-2.5 │
        (PDF  • 研报  •  │  - createContext()            │
         1M token)       │  - generateContent()          │
                         └──────────┬────────────────────┘
                                     │ cached context_id
Frontend Chat ←───REST/WS───► LLMService  layer  ◄───VectorRetriever
      user Q                (LLMProvider)        (FAISS, Redis)
              ▲                                  
              │ fallback             ┌───────────┐
              │                      │ Mistral-7B│
              └──────── if error────►│ 4-bit CPU │
                                     └───────────┘
LLMProvider 抽象 (providers.yaml)

gemini_pro: endpoint, location, model, context_cache=true

gemini_flash: fallback for FAQ

local_7b: offline emergency

Context 缓存流程

大文件上传 → createContext() → 得到 context_id，价格 $0.31/M tok/小时

后续每次对话只发 1k prompt + context_id → 只计小 prompt 成本

RAG 结合：先用向量库检索用户组合 & 最新行情摘要，再把结果与 question 拼成 prompt，调用 generateContent()。

3 | 功能映射
产品层功能	Gemini 优势	调用模式
AlertModal 深度解读	一次读取：
• 30 d 逐笔交易表
• 5 篇新闻全文
• ETF 成分	context_id + question
PDF 一键报告	将整本 120 k token 年报 + 30 k 分析师笔记一次总结	generateContent → pdfkit
AI Chat “多文档对比”	1 M 窗口直接放 A、B 两份报表，比差异	context_id 多分段

4 | 成本控制策略
技术	限额	节流手段
Context Cache	$0.31 / 1 M tok/h	仅大文件生成，2 h 无用即 deleteContext
Role 路由	FAQ/闲聊→ Gemini Flash ($0.35 out)	Middleware detect intent
Batch Embed	向量检索用开源 MiniLM	无 API 成本
彩排 Token 预算	演示 15 次大调用 + 日常 100 请求 ≈ $35	账单导出在 Pitch Deck 展示

5 | 交互节奏 & Wow Factor
现场上传 200 页银行年报 → 进度条（调用 createContext）

完成后聊天框输入 “总结现金流风险” → 5 秒生成带分点 & 引用的分析

点击 PDF 报告 → 生成 1 页高管摘要 PDF，下载链接弹 Toast

断网演示：切 USE_LOCAL_LLM=1，回答自动降级（显示 “local-7B” badge）

6 | Pitch Slide bullets
“1 M token 上下文：一次性读完全年研报 + 30 天交易流水，无需分页提问”

“东南亚区域托管，数据落 SG，未来可移至 Vertex Private Service → 私有云部署”

“PoC 总成本 $35，已在预算；LLMProvider 支持一键切换私有 Llama 3-70B”

“Fail-safe 4-bit 本地模型 Demo：断网场景照样回答”

7 | Sprint 任务清单（AI 集成）
D-1	D-2	D-3	D-4	D-5
GCP 项目、SA、key	封装 LLMProvider	实现 context cache + Flash 路由	前端接入 /env switches	成本日志 & 断网降级 demo

完成后即可用 Gemini 2.5 Pro 作为“长文档思考引擎”，在 Hackathon 上提供高质量、低延迟、成本可控的 AI 体验，同时在汇报中展示可迁移、合规的未来路线。