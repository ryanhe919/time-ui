/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 构造 MCP Server 并注册 TimeUI 文档查询 4 件套。stdio 与 HTTP transport 通过 createServer() 共用同一份工具实现，避免行为漂移。
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { getComponent, listCategories, listComponents, searchComponents } from './tools';

// 从 package.json 动态拿 version，避免硬编码导致与发布态脱钩。
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')) as {
  name: string;
  version: string;
};

const LocaleSchema = z
  .enum(['zh', 'en'])
  .describe("Content language; defaults to 'zh' when omitted.");

// 下列 schema 直接同时服务于两件事：一是 MCP 声明 inputSchema（JSON Schema），二是在 CallTool 时 parse 校验入参。
const ListCategoriesInput = z.object({ locale: LocaleSchema.optional() }).strict();

const ListComponentsInput = z
  .object({
    locale: LocaleSchema.optional(),
    category: z
      .string()
      .optional()
      .describe(
        "Optional category slug to filter by (see list_categories). E.g. 'forms', 'overlays'.",
      ),
  })
  .strict();

const GetComponentInput = z
  .object({
    slug: z
      .string()
      .min(1)
      .describe(
        "Component slug, typically kebab-case (e.g. 'button', 'date-picker'). Obtain from list_components.",
      ),
    locale: LocaleSchema.optional(),
  })
  .strict();

const SearchComponentsInput = z
  .object({
    query: z
      .string()
      .min(1)
      .describe('Free-text search string. Tokenized; supports English and CJK.'),
    locale: LocaleSchema.optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Maximum number of hits to return. Default 10, max 50.'),
  })
  .strict();

interface ToolSpec<S extends ZodTypeAny> {
  name: string;
  description: string;
  schema: S;
  handler: (input: z.infer<S>) => unknown;
}

// zod-to-json-schema 返回的顶层结构里有 $schema 字段，MCP 协议并不需要；剥掉保持输出干净。
function toInputSchema(schema: ZodTypeAny): Tool['inputSchema'] {
  const json = zodToJsonSchema(schema, { target: 'jsonSchema7' }) as Record<string, unknown>;
  delete json.$schema;
  return json as Tool['inputSchema'];
}

const TOOL_SPECS: [
  ToolSpec<typeof ListCategoriesInput>,
  ToolSpec<typeof ListComponentsInput>,
  ToolSpec<typeof GetComponentInput>,
  ToolSpec<typeof SearchComponentsInput>,
] = [
  {
    name: 'list_categories',
    description:
      "List all TimeUI component categories (e.g. forms, overlays, feedback) with the number of components in each. Call this FIRST when the user asks 'what components exist' or you need to orient yourself before recommending anything.",
    schema: ListCategoriesInput,
    handler: (input) => listCategories({ locale: input.locale }),
  },
  {
    name: 'list_components',
    description:
      'List all TimeUI components with slug, title, short description, and category. Optionally filter by a category slug. Use to enumerate candidates before drilling into details with get_component.',
    schema: ListComponentsInput,
    handler: (input) => listComponents({ locale: input.locale, category: input.category }),
  },
  {
    name: 'get_component',
    description:
      'Fetch the full documentation (title, description, prose content, runnable code examples, docs URL) for a single component by slug. Use this once the user identifies a specific component or after search_components narrows down a match.',
    schema: GetComponentInput,
    handler: (input) => getComponent({ slug: input.slug, locale: input.locale }),
  },
  {
    name: 'search_components',
    description:
      "Full-text search across component titles, descriptions, and docs content, scored and ranked. Use when the user describes behavior or a use case (e.g. 'modal with form') but has NOT named a specific component. Returns slug + snippet so you can decide whether to call get_component.",
    schema: SearchComponentsInput,
    handler: (input) =>
      searchComponents({
        query: input.query,
        locale: input.locale,
        limit: input.limit,
      }),
  },
];

/**
 * 构造并返回一个注册了全部工具处理器、但尚未 connect 任何 transport 的 MCP Server。
 * 调用方（stdio.ts / http.ts / 外部进程）自行挑选 transport 再 `await server.connect(transport)`。
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: pkg.name,
      version: pkg.version,
    },
    {
      capabilities: {
        tools: {},
      },
      // 写给 LLM 读：让它把"先列目录再给推荐"当默认动作，减少凭印象答题导致的幻觉。
      instructions:
        'Serves TimeUI component library documentation. Always call list_categories or list_components before recommending usage patterns. Use search_components when the user describes behavior, and get_component to fetch full docs + examples for a specific slug.',
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: TOOL_SPECS.map((spec) => ({
      name: spec.name,
      description: spec.description,
      inputSchema: toInputSchema(spec.schema),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: rawArgs } = request.params;
    const spec = TOOL_SPECS.find((s) => s.name === name);
    if (!spec) {
      // MCP 规范推荐通过 isError + text content 传递工具级错误，而不是抛协议异常。
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
    }

    try {
      const parsed = spec.schema.parse(rawArgs ?? {}) as never;
      const result = (spec.handler as (i: never) => unknown)(parsed);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof z.ZodError
          ? `Invalid arguments: ${JSON.stringify(err.issues)}`
          : err instanceof Error
            ? err.message
            : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: message }],
      };
    }
  });

  return server;
}
