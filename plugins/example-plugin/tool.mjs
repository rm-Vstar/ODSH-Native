// plugins/example-plugin/tool.mjs — 示例插件工具
export default async function echoTool({ text } = {}) {
  return { ok: true, echoed: String(text ?? '') };
}
