// tests/gateway-client.test.mjs - WS keepalive frame format (masked ping)
import { wsSendPing } from "../src/gateway/gateway-client.mjs";

export async function t_ws_ping_frame_is_masked_and_empty(t) {
  const chunks = [];
  const fake = { write: (b) => { chunks.push(Buffer.from(b)); return true; } };
  wsSendPing(fake);
  const frame = Buffer.concat(chunks);
  t.ok(frame.length >= 2, "ping frame has a header");
  t.ok((frame[0] & 0x80) === 0x80, "FIN bit must be set");
  t.ok((frame[0] & 0x0f) === 0x9, "opcode must be ping (0x9)");
  t.ok((frame[1] & 0x80) === 0x80, "client frames must be masked (RFC 6455)");
  t.ok((frame[1] & 0x7f) === 0, "keepalive ping carries an empty payload");
  return "ping frame format ok";
}