import { EMPTY_OBJECT, get, matchAll } from "../shared/utils";

export type TemplateVariables = {
  [key: string]: unknown;
};

export type TemplateToken =
  | {
      index: number;
      kind: "text";
      text: string;
    }
  | {
      index: number;
      kind: "variable";
      text: string;
      name: string;
      raw: boolean;
      fallback?: string;
    };

export interface TemplateParseResult {
  hasVariables: boolean;
  tokens: TemplateToken[];
}

const TEMPLATE_PARSE_CACHE: Map<
  RegExp,
  Map<string, TemplateParseResult>
> = /* @__PURE__ */ new Map();

const DEFAULT_TEMPLATE_RULE = /\{([^{}]+)\}/;

export interface TemplateParseOptions {
  rule?: RegExp;
}

export function parseTemplate(
  template: string,
  options: TemplateParseOptions = EMPTY_OBJECT,
): TemplateParseResult {
  const { rule = DEFAULT_TEMPLATE_RULE } = options;

  let cache = TEMPLATE_PARSE_CACHE.get(rule);
  let result: TemplateParseResult | undefined;

  if (!cache) {
    cache = new Map();

    TEMPLATE_PARSE_CACHE.set(rule, cache);

    result = undefined;
  } else {
    result = cache.get(template);
  }

  if (result) {
    return result;
  }

  const hasVariables = rule.test(template);
  const tokens: TemplateToken[] = [];

  if (hasVariables) {
    const reg = new RegExp(rule.source, rule.global ? rule.flags : `${rule.flags}g`);

    let current = 0;

    for (const matched of matchAll(template, reg)) {
      const { 0: text, 1: expression, index } = matched;

      if (current < index) {
        tokens.push({
          index: current,
          kind: "text",
          text: template.slice(current, index),
        });
      }

      let name;
      let fallback;
      let raw = false;

      const fallbackMarkerIndex = expression.indexOf("??");

      if (fallbackMarkerIndex > -1) {
        name = expression.slice(0, fallbackMarkerIndex).trim();
        fallback = expression.slice(fallbackMarkerIndex + 2).trim();
      } else {
        name = expression.trim();
      }

      if (name.endsWith(":raw")) {
        name = name.slice(0, -4);
        raw = true;
      }

      tokens.push({
        index,
        kind: "variable",
        text,
        name,
        raw,
        fallback,
      });

      current = index + text.length;
    }

    if (current < template.length) {
      tokens.push({
        index: current,
        kind: "text",
        text: template.slice(current),
      });
    }
  } else {
    tokens.push({
      index: 0,
      kind: "text",
      text: template,
    });
  }

  result = {
    hasVariables,
    tokens,
  };

  cache.set(template, result);

  return result;
}

export interface TemplateCompileRender {
  (variables?: TemplateVariables): string;
  $fn?: (
    variables: TemplateVariables,
    stringify: (value: unknown, raw?: boolean) => string,
    get: <TValue>(target: any, path: string[]) => TValue,
  ) => string;
}

const TEMPLATE_COMPILE_CACHE: Map<
  RegExp,
  Map<string, TemplateCompileRender>
> = /* @__PURE__ */ new Map();

export interface TemplateCompileOptions extends TemplateParseOptions {
  escape?: false | ((value: string) => string);
}

export function compileTemplate(
  template: string,
  options: TemplateCompileOptions = EMPTY_OBJECT,
): TemplateCompileRender {
  const { rule = DEFAULT_TEMPLATE_RULE } = options;

  let cache = TEMPLATE_COMPILE_CACHE.get(rule);
  let render: TemplateCompileRender | undefined;

  if (!cache) {
    cache = new Map();

    TEMPLATE_COMPILE_CACHE.set(rule, cache);

    render = undefined;
  } else {
    render = cache.get(template);
  }

  if (render) {
    return render;
  }

  const result = parseTemplate(template, options);

  if (!result.hasVariables) {
    render = () => template;
  } else {
    const stringify = createStringify(options);

    const { tokens } = result;

    let body = tokens.reduce((result, token, index) => {
      if (token.kind === "text") {
        const { text } = token;

        return result + `var $${index} = ${JSON.stringify(text)};`;
      }

      const { text, name, raw, fallback } = token;

      if (!name.includes(".")) {
        if (fallback === undefined) {
          return (
            result +
            `var $${index} = variables[${JSON.stringify(name)}];` +
            `if ($${index} === undefined) {` +
            `$${index} = stringify(${JSON.stringify(text)}, ${raw});` +
            `} else {` +
            `$${index} = stringify($${index}, ${raw});` +
            `}`
          );
        }

        return (
          result +
          `var $${index} = variables[${JSON.stringify(name)}];` +
          `if ($${index} === undefined) {` +
          `$${index} = stringify(${JSON.stringify(fallback)}, ${raw});` +
          `} else {` +
          `$${index} = stringify($${index}, ${raw});` +
          `}`
        );
      }

      if (fallback === undefined) {
        return (
          result +
          `var $${index} = variables[${JSON.stringify(name)}];` +
          `if ($${index} === undefined) {` +
          `$${index} = get(variables, ${JSON.stringify(name.split("."))});` +
          `if ($${index} === undefined) {` +
          `$${index} = stringify(${JSON.stringify(text)}, ${raw});` +
          `} else {` +
          `$${index} = stringify($${index}, ${raw});` +
          `}` +
          `}`
        );
      }

      return (
        result +
        `var $${index} = variables[${JSON.stringify(name)}];` +
        `if ($${index} === undefined) {` +
        `$${index} = get(variables, ${JSON.stringify(name.split("."))});` +
        `if ($${index} === undefined) {` +
        `$${index} = stringify(${JSON.stringify(fallback)}, ${raw});` +
        `} else {` +
        `$${index} = stringify($${index}, ${raw});` +
        `}` +
        `}`
      );
    }, "");

    body =
      body +
      `return ${tokens.reduce((result, _token, index) => {
        return result ? `${result} + $${index}` : `$${index}`;
      }, "")};`;

    const $fn = new Function("variables", "stringify", "get", body) as NonNullable<
      TemplateCompileRender["$fn"]
    >;

    render = (variables: TemplateVariables = EMPTY_OBJECT) => {
      return $fn(variables, stringify, get);
    };

    render.$fn = $fn;
  }

  cache.set(template, render);

  return render;
}

export interface TemplateRenderOptions extends TemplateCompileOptions {
  compile?: boolean;
}

export function renderTemplate(
  template: string,
  variables: TemplateVariables = EMPTY_OBJECT,
  options: TemplateRenderOptions = EMPTY_OBJECT,
): string {
  const { compile = true } = options;

  if (compile) {
    const render = compileTemplate(template, options);

    return render(variables);
  }

  const result = parseTemplate(template, options);

  if (!result.hasVariables) {
    return template;
  }

  const stringify = createStringify(options);

  const { tokens } = result;

  return tokens.reduce((result, token) => {
    if (token.kind === "text") {
      const { text } = token;

      return result + text;
    }

    const { text, name, raw, fallback } = token;

    let value = variables[name];

    if (value === undefined) {
      if (name.includes(".")) {
        value = get(variables, name.split("."));

        if (value === undefined) {
          value = fallback;
        }
      } else {
        value = fallback;
      }

      if (value === undefined) {
        return result + stringify(text, raw);
      }
    }

    return result + stringify(value, raw);
  }, "");
}

const STRINGIFY_CACHE: Map<(value: string) => string, (value: unknown, raw?: boolean) => string> =
  /* @__PURE__ */ new Map();

function createStringify(options: TemplateCompileOptions) {
  const { escape = encodeURIComponent } = options;

  if (!escape) {
    return string;
  }

  let stringify = STRINGIFY_CACHE.get(escape);

  if (!stringify) {
    stringify = (value: unknown, raw?: boolean) => {
      if (!raw) {
        return escape(string(value));
      }

      return string(value);
    };

    STRINGIFY_CACHE.set(escape, stringify);
  }

  return stringify;
}

function string(value: unknown) {
  return String(value);
}
