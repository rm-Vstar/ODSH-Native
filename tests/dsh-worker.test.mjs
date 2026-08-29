// tests/dsh-worker.test.mjs - remote endpoint scheme validation (fail-closed)
import { validateWorkerEndpoint } from "../src/runtime/dsh-worker.mjs";

export async function t_dsh_worker_endpoint_scheme_validation(t) {
  t.ok(validateWorkerEndpoint("http://127.0.0.1:8000").ok, "http is allowed (documented contract)");
  t.ok(validateWorkerEndpoint("https://worker.example:8443").ok, "https is allowed");
  t.ok(!validateWorkerEndpoint("localhost:8000").ok, "bare host (no scheme) must be rejected");
  t.ok(!validateWorkerEndpoint("").ok, "empty endpoint must be rejected");
  t.ok(!validateWorkerEndpoint("file:///tmp/worker").ok, "non-http scheme must be rejected");
  t.ok(!validateWorkerEndpoint("ftp://worker.example").ok, "ftp scheme must be rejected");
  return "endpoint scheme validation ok";
}