/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 智能文档助手 API route：封装 MiniMax Anthropic 兼容接口的 tool-calling loop，
 *   通过 SSE 把文本分片、工具调用进度与命中组件引用同步给前端。
 */

import path from 'node:path';

import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  TextBlockParam,
  ToolResultBlockParam,
  ToolUnion,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages';
import {
  loadIndex,
  listCategories,
  listComponents,
  getComponent,
  searchComponents,
  listSections,
  listGuides,
  getGuide,
  searchGuides,
  type ComponentSummary,
  type SearchHit,
  type GuideSummary,
  type GuideSearchHit,
} from '@timeui/mcp';
import type { NextRequest } from 'next/server';

// Node runtime 才能复用 @timeui/mcp 的文件系统索引加载。
export const runtime = 'nodejs';
// 流式响应不能被 CDN 缓存。
export const dynamic = 'force-dynamic';

type SupportedLocale = 'zh' | 'en';

interface RequestBody {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  locale?: SupportedLocale;
}

interface RefItem {
  slug: string;
  title: string;
  href: string;
}

// MiniMax 目前未必兼容 Anthropic prompt caching；默认关闭，留显式开关方便后续打开验证。
const ENABLE_PROMPT_CACHE = process.env.ANTHROPIC_PROMPT_CACHE === '1';
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? 'MiniMax-M1';
// 防止工具调用 loop 无限展开，超出硬上限直接收尾回答。
const MAX_TOOL_ROUNDS = 6;

// webpack 会把 @timeui/mcp 打进 route bundle 并把 data.ts 里的 __dirname 烘焙
// 成构建机器绝对路径，导致运行时 loadIndex() 用 DEFAULT_INDEX_PATH 读文件时
// 在服务器上 ENOENT。改由 route 显式用 process.cwd()（pm2 启动时 cd 到
// apps/docs）拼出索引真实路径，首次请求时把它塞进 loadIndex 的内部缓存，后续
// 纯函数工具（listCategories / listComponents / ...）再无参调用就命中缓存。
// 路径前提：next.config 的 outputFileTracingIncludes 已经把 packages/mcp/data
// 同步进了 standalone 产物，相对 apps/docs 往上两级即是。
const DOCS_INDEX_PATH = path.resolve(
  process.cwd(),
  '..',
  '..',
  'packages',
  'mcp',
  'data',
  'index.json',
);
let indexWarmed = false;
function warmDocsIndex(): void {
  if (indexWarmed) return;
  loadIndex(DOCS_INDEX_PATH);
  indexWarmed = true;
}

// ---------- Tool schema ----------

// description 故意写英文并明确返回字段结构 —— LLM 更容易挑选正确的工具。
// 8 件套：组件 4 件 + 指南 4 件，与 @timeui/mcp server.ts 保持完全平行。
const TOOL_DEFINITIONS: ToolUnion[] = [
  {
    name: 'list_categories',
    description:
      'List all component categories in the TimeUI library with the number of components per category. Use this first when the user asks for an overview or does not mention a specific component.',
    input_schema: {
      type: 'object',
      properties: {
        locale: {
          type: 'string',
          enum: ['zh', 'en'],
          description: 'Locale of the returned labels. Defaults to the conversation locale.',
        },
      },
    },
  },
  {
    name: 'list_components',
    description:
      'List component summaries (slug, title, short description, category, href). Optionally filter by a category slug returned from list_categories.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category slug (e.g. "forms", "overlays"). Omit to list every component.',
        },
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
    },
  },
  {
    name: 'get_component',
    description:
      'Fetch the full documentation detail for a single component: title, description, body content, example code blocks, and href. Use after narrowing down via search_components.',
    input_schema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description:
            'Component slug returned from list_components or search_components (e.g. "button").',
        },
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
      required: ['slug'],
    },
  },
  {
    name: 'search_components',
    description:
      'Full-text search across component titles, descriptions, and bodies. Returns ranked hits with snippets. Prefer this over list_components when the user asks a concrete question about a UI component.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (natural language, zh or en).' },
        limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Max hits to return.' },
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_sections',
    description:
      'List all top-level guide sections (e.g. "getting-started", "chat") with the number of guide pages per section. Use this when the user asks how to install / set up / configure the library, or wants an overview of non-component documentation.',
    input_schema: {
      type: 'object',
      properties: {
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
    },
  },
  {
    name: 'list_guides',
    description:
      'List all guide pages (installation, introduction, MCP setup, chat overview, etc.) with slug, title, short description, section, and href. Optionally filter by a section slug.',
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Section slug (e.g. "getting-started", "chat"). Omit to list every guide.',
        },
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
    },
  },
  {
    name: 'get_guide',
    description:
      'Fetch the full content (title, description, body, code examples, href) of a single guide page by slug — e.g. "installation" for setup steps, "mcp" for MCP server deployment, "api" for the chat API reference.',
    input_schema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description:
            'Guide slug from list_guides or search_guides (e.g. "installation", "mcp", "overview").',
        },
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
      required: ['slug'],
    },
  },
  {
    name: 'search_guides',
    description:
      'Full-text search across guide pages ONLY (does not return components). Use this when the user asks how to install, configure, integrate, or use the library — e.g. "how do I install", "怎么接入 chat", "SSE streaming". For component-by-name queries use search_components instead.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (natural language, zh or en).' },
        limit: { type: 'integer', minimum: 1, maximum: 20 },
        locale: { type: 'string', enum: ['zh', 'en'] },
      },
      required: ['query'],
    },
  },
];

function buildSystemPrompt(locale: SupportedLocale): string {
  const langHint =
    locale === 'zh'
      ? 'Respond in Simplified Chinese unless the user explicitly asks for English.'
      : 'Respond in English unless the user explicitly asks for another language.';
  return [
    'You are the official documentation assistant for the TimeUI React component library.',
    'Always call the provided tools to fetch real data before answering. Do not fabricate component names, props, or installation steps.',
    'Tool selection rule:',
    '- For UI COMPONENT questions ("how do I use Button", "is there a date picker", "show me Modal props"): use list_categories / list_components / search_components / get_component.',
    '- For HOW-TO / SETUP / INTEGRATION questions ("how do I install", "how to wire up MCP", "how to enable chat", "SSE streaming", "API reference"): use list_sections / list_guides / search_guides / get_guide instead — these cover installation, integration, and the chat module.',
    'When you reference a page, format it as a markdown link using the `href` field returned by the tools, e.g. "[Button](/zh/docs/components/button)" or "[Installation](/zh/docs/getting-started/installation)".',
    'Prefer concise answers with short bullet lists and code fences when showing usage.',
    "If the tools return no hits, tell the user plainly and suggest rewording the question — don't invent an answer.",
    langHint,
  ].join(' ');
}

// ---------- Tool executors ----------

function runTool(
  name: string,
  input: Record<string, unknown>,
  locale: SupportedLocale,
): {
  payload: unknown;
  summary: string;
  refs: RefItem[];
} {
  // 所有工具都走 locale fallback；避免工具明确没传时回落到包默认（zh）而与对话语言错位。
  const lc: SupportedLocale = (input.locale as SupportedLocale | undefined) ?? locale;

  switch (name) {
    case 'list_categories': {
      const data = listCategories({ locale: lc });
      return { payload: data, summary: `${data.length} categories`, refs: [] };
    }
    case 'list_components': {
      const category =
        typeof input.category === 'string' && input.category.length > 0
          ? input.category
          : undefined;
      const data = listComponents({ locale: lc, category });
      return {
        payload: data,
        summary: `${data.length} components${category ? ` in ${category}` : ''}`,
        refs: toRefsFromSummaries(data),
      };
    }
    case 'get_component': {
      const slug = String(input.slug ?? '');
      const data = getComponent({ locale: lc, slug });
      return {
        payload: data ?? { error: `component not found: ${slug}` },
        summary: data ? `detail for ${data.slug}` : `not found: ${slug}`,
        refs: data ? [{ slug: data.slug, title: data.title, href: data.href }] : [],
      };
    }
    case 'search_components': {
      const query = String(input.query ?? '');
      const limit =
        typeof input.limit === 'number' && Number.isFinite(input.limit)
          ? Math.max(1, Math.min(20, Math.floor(input.limit)))
          : 8;
      const data = searchComponents({ locale: lc, query, limit });
      return {
        payload: data,
        summary: `${data.length} hits for "${query}"`,
        refs: toRefsFromHits(data),
      };
    }
    case 'list_sections': {
      const data = listSections({ locale: lc });
      return { payload: data, summary: `${data.length} sections`, refs: [] };
    }
    case 'list_guides': {
      const section =
        typeof input.section === 'string' && input.section.length > 0 ? input.section : undefined;
      const data = listGuides({ locale: lc, section });
      return {
        payload: data,
        summary: `${data.length} guides${section ? ` in ${section}` : ''}`,
        refs: toRefsFromGuideSummaries(data),
      };
    }
    case 'get_guide': {
      const slug = String(input.slug ?? '');
      const data = getGuide({ locale: lc, slug });
      return {
        payload: data ?? { error: `guide not found: ${slug}` },
        summary: data ? `detail for ${data.slug}` : `not found: ${slug}`,
        refs: data ? [{ slug: data.slug, title: data.title, href: data.href }] : [],
      };
    }
    case 'search_guides': {
      const query = String(input.query ?? '');
      const limit =
        typeof input.limit === 'number' && Number.isFinite(input.limit)
          ? Math.max(1, Math.min(20, Math.floor(input.limit)))
          : 8;
      const data = searchGuides({ locale: lc, query, limit });
      return {
        payload: data,
        summary: `${data.length} guide hits for "${query}"`,
        refs: toRefsFromGuideHits(data),
      };
    }
    default:
      return {
        payload: { error: `unknown tool: ${name}` },
        summary: `unknown tool: ${name}`,
        refs: [],
      };
  }
}

function toRefsFromHits(hits: SearchHit[]): RefItem[] {
  return hits.slice(0, 6).map((h) => ({ slug: h.slug, title: h.title, href: h.href }));
}

function toRefsFromSummaries(list: ComponentSummary[]): RefItem[] {
  // list 接口可能返回全量；限制 refs 数量，避免前端 chip 爆炸。
  return list.slice(0, 8).map((c) => ({ slug: c.slug, title: c.title, href: c.href }));
}

function toRefsFromGuideSummaries(list: GuideSummary[]): RefItem[] {
  return list.slice(0, 8).map((g) => ({ slug: g.slug, title: g.title, href: g.href }));
}

function toRefsFromGuideHits(hits: GuideSearchHit[]): RefItem[] {
  return hits.slice(0, 6).map((h) => ({ slug: h.slug, title: h.title, href: h.href }));
}

// ---------- SSE helpers ----------

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

function createSSEWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();
  let closed = false;
  return {
    send(event, data) {
      if (closed) return;
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${payload}\n\n`));
    },
    close() {
      if (closed) return;
      closed = true;
      try {
        controller.close();
      } catch {
        // already closed
      }
    },
  };
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // 禁止 Next / 反向代理缓冲 SSE。
    'X-Accel-Buffering': 'no',
  };
}

// ---------- Handler ----------

export async function POST(req: NextRequest): Promise<Response> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    body = {};
  }
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const locale: SupportedLocale = body.locale === 'en' ? 'en' : 'zh';

  // env 缺失：不返回 500，交给前端 SSE 流显式渲染错误提示。
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return noKeyResponse();
  }

  const messages: MessageParam[] = rawMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: m.content }));

  // 没有任何用户输入 → 直接返回错误，避免 400。
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return errorResponse('empty-input', 'No user message to answer.');
  }

  const client = new Anthropic({
    apiKey,
    // baseURL 允许空；SDK 默认指向 api.anthropic.com。生产环境应显式配 MiniMax。
    baseURL: process.env.ANTHROPIC_BASE_URL,
  });

  // 先同步预热 mcp 索引缓存；如果文件不在预期位置（比如 outputFileTracing
  // 漏抓或部署结构变了），提前走 SSE error 分支，不让错误埋进 tool loop。
  try {
    warmDocsIndex();
  } catch (err) {
    console.error('[assistant] failed to warm docs index at', DOCS_INDEX_PATH, err);
    return errorResponse(
      'index-load-failed',
      `Docs index not found at ${DOCS_INDEX_PATH}. Check outputFileTracingIncludes / deploy layout.`,
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writer = createSSEWriter(controller);
      void runConversation(client, writer, messages, locale).finally(() => writer.close());
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

// ---------- Core loop ----------

async function runConversation(
  client: Anthropic,
  writer: SSEWriter,
  messages: MessageParam[],
  locale: SupportedLocale,
): Promise<void> {
  const system = buildSystemPrompt(locale);

  // 稳定前缀（system + tools）打 cache_control 标记 —— Anthropic 官方支持；MiniMax 若不识别会忽略。
  // 若目标后端因未知字段返回 400，可把 ANTHROPIC_PROMPT_CACHE 留空关闭此优化。
  const systemParam: TextBlockParam[] | string = ENABLE_PROMPT_CACHE
    ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
    : system;
  const toolsParam: ToolUnion[] = ENABLE_PROMPT_CACHE
    ? TOOL_DEFINITIONS.map((t, i) =>
        // 只在最后一条 tool 上打 breakpoint，按官方建议保持最多 4 个 breakpoint。
        i === TOOL_DEFINITIONS.length - 1
          ? ({ ...t, cache_control: { type: 'ephemeral' } } as ToolUnion)
          : t,
      )
    : TOOL_DEFINITIONS;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const assistantBlocks: Array<
        | { type: 'text'; text: string }
        | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
      > = [];
      const toolUseIndexById = new Map<string, number>();
      let stopReason: string | null = null;

      const sdkStream = client.messages.stream({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        system: systemParam,
        tools: toolsParam,
        messages,
      });

      // 统一监听 raw events：既处理文本分片，又累计 tool_use 的 JSON 输入。
      sdkStream.on('streamEvent', (event) => {
        if (event.type === 'content_block_start') {
          const block = event.content_block;
          if (block.type === 'text') {
            assistantBlocks.push({ type: 'text', text: '' });
          } else if (block.type === 'tool_use') {
            const idx = assistantBlocks.length;
            assistantBlocks.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: {},
            });
            toolUseIndexById.set(block.id, idx);
          }
        } else if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta.type === 'text_delta') {
            // 累积到当前 text block 并透传给前端。
            const current = assistantBlocks[assistantBlocks.length - 1];
            if (current && current.type === 'text') {
              current.text += delta.text;
            }
            writer.send('delta', { text: delta.text });
          }
          // input_json_delta 会由 SDK 累积到 finalMessage；这里无需手工解析。
        } else if (event.type === 'message_delta') {
          if (event.delta.stop_reason) stopReason = event.delta.stop_reason;
        }
      });

      const final = await sdkStream.finalMessage();

      // 用 finalMessage 回填 tool_use 的 input（SDK 已聚合好 JSON）。
      for (const block of final.content) {
        if (block.type === 'tool_use') {
          const idx = toolUseIndexById.get(block.id);
          if (idx !== undefined) {
            const slot = assistantBlocks[idx];
            if (slot && slot.type === 'tool_use') {
              slot.input = (block.input as Record<string, unknown>) ?? {};
            }
          }
        }
      }

      // 追加 assistant 回复到 messages，供下一轮（若有 tool_use）继续。
      messages.push({ role: 'assistant', content: final.content });

      if (stopReason !== 'tool_use' && final.stop_reason !== 'tool_use') {
        // 正常结束。
        return;
      }

      // 执行工具、回传 tool_result。
      const toolUses = final.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
      const toolResults: ToolResultBlockParam[] = [];
      const roundRefs: RefItem[] = [];

      for (const tu of toolUses) {
        writer.send('tool_use', { name: tu.name, input: tu.input });
        let resultContent: string;
        let summary: string;
        let isError = false;
        try {
          const {
            payload,
            summary: s,
            refs,
          } = runTool(tu.name, (tu.input as Record<string, unknown>) ?? {}, locale);
          summary = s;
          resultContent = JSON.stringify(payload);
          for (const r of refs) roundRefs.push(r);
        } catch (err) {
          isError = true;
          summary = 'tool execution failed';
          resultContent = JSON.stringify({
            error: err instanceof Error ? err.message : 'unknown error',
          });
        }

        writer.send('tool_result', { name: tu.name, summary });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: resultContent,
          is_error: isError || undefined,
        });
      }

      // 合并同轮多次工具命中到一条 refs 事件（slug 去重）。
      if (roundRefs.length > 0) {
        const unique = dedupeRefs(roundRefs);
        writer.send('refs', { components: unique });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    // 超过最大 tool_use round 次数仍未收尾：提示前端。
    writer.send('error', { message: 'Exceeded max tool-call rounds.' });
  } catch (err) {
    // 绝不把 API key / headers 写入错误事件。
    const message = err instanceof Error ? err.message : 'Unknown error.';
    console.error('[assistant] upstream error:', message);
    writer.send('error', { message: sanitizeError(message) });
  } finally {
    writer.send('done', {});
  }
}

function dedupeRefs(list: RefItem[]): RefItem[] {
  const seen = new Set<string>();
  const out: RefItem[] = [];
  for (const r of list) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    out.push(r);
  }
  return out;
}

function sanitizeError(msg: string): string {
  // 粗过滤，避免 API key 意外被错误消息带出（SDK 通常不会，但防御性保留）。
  return msg.replace(/sk-[A-Za-z0-9_-]{10,}/g, 'sk-***');
}

function noKeyResponse(): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const w = createSSEWriter(controller);
      w.send('error', { code: 'no-key', message: 'ANTHROPIC_API_KEY is not configured.' });
      w.send('done', {});
      w.close();
    },
  });
  return new Response(body, { headers: sseHeaders() });
}

function errorResponse(code: string, message: string): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const w = createSSEWriter(controller);
      w.send('error', { code, message });
      w.send('done', {});
      w.close();
    },
  });
  return new Response(body, { headers: sseHeaders() });
}
