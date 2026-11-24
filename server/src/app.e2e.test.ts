import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, test } from 'node:test';

// Deterministic environment; must be set before the app modules are (dynamically) imported.
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'e2e-test-key';
process.env.OPENAI_MODEL = 'gpt-e2e-test';
process.env.DATABASE_URL = '';
process.env.ASK_SCRIPTURE_ENABLED = 'true';
process.env.FREE_ASKS_PER_DAY = '3';

type JsonRecord = Record<string, any>;

const PASSAGE_REFERENCE = 'PHP.4.6';

function modelAnswer(overrides: JsonRecord = {}): JsonRecord {
  return {
    summary: 'God invites you to bring every worry to Him in prayer.',
    scriptures: [{ reference: PASSAGE_REFERENCE, reason: 'This passage speaks directly to anxiety and prayerful trust.' }],
    context: 'Paul wrote to the Philippians from prison, urging prayerful trust instead of anxiety.',
    application: 'When worry rises, pause and name each concern to God with thanksgiving.',
    reflectionQuestions: ['What worry can you hand to God today?'],
    prayer: 'Lord, help me trade my anxiety for Your peace. Amen.',
    nextStep: 'Write down one anxious thought and pray over it tonight.',
    safetyNote: '',
    ...overrides,
  };
}

// Shaped like a non-streaming OpenAI Responses API payload; the SDK derives
// `output_text` from output message content items of type `output_text`.
function openAiResponsePayload(answer: JsonRecord = modelAnswer()): JsonRecord {
  return {
    id: 'resp_e2e_fake',
    object: 'response',
    created_at: 0,
    status: 'completed',
    error: null,
    model: 'gpt-e2e-test',
    output: [
      {
        type: 'message',
        id: 'msg_e2e_fake',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text: JSON.stringify(answer), annotations: [] }],
      },
    ],
    usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300 },
  };
}

const fakeOpenAi = {
  status: 200,
  delayMs: 0,
  payload: openAiResponsePayload(),
  requests: [] as Array<{ method: string; url: string; body: JsonRecord }>,
};

const upstream = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    fakeOpenAi.requests.push({
      method: req.method ?? '',
      url: req.url ?? '',
      body: JSON.parse(Buffer.concat(chunks).toString() || '{}'),
    });
    setTimeout(() => {
      res.writeHead(fakeOpenAi.status, { 'content-type': 'application/json' });
      const body = fakeOpenAi.status === 200
        ? fakeOpenAi.payload
        : { error: { message: 'Simulated upstream failure.', type: 'invalid_request_error', code: null, param: null } };
      res.end(JSON.stringify(body));
    }, fakeOpenAi.delayMs);
  });
});

let appServer: http.Server;
let baseUrl: string;
let usageStoreModule: typeof import('./services/usageStore.js');

// Unique per-request IPs keep the in-process rate limiter buckets isolated
// between tests (the app trusts one proxy hop, so X-Forwarded-For sets req.ip).
let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `10.1.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

function askBody(overrides: JsonRecord = {}): JsonRecord {
  return {
    question: 'How can I find peace when I am anxious about the future?',
    language: 'en',
    passages: [
      {
        reference: PASSAGE_REFERENCE,
        displayReference: 'Philippians 4:6',
        text: 'Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.',
      },
    ],
    ...overrides,
  };
}

async function postAsk(options: { clientId?: string | null; body?: unknown; ip?: string } = {}) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-forwarded-for': options.ip ?? nextIp(),
  };
  if (options.clientId !== null) {
    headers['x-faith-client-id'] = options.clientId ?? randomUUID();
  }
  const response = await fetch(`${baseUrl}/api/ask-scripture`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options.body ?? askBody()),
  });
  return { status: response.status, json: (await response.json()) as JsonRecord };
}

async function getUsage(clientId: string, ip?: string) {
  const response = await fetch(`${baseUrl}/api/ask-scripture/usage`, {
    headers: { 'x-faith-client-id': clientId, 'x-forwarded-for': ip ?? nextIp() },
  });
  return { status: response.status, json: (await response.json()) as JsonRecord };
}

before(async () => {
  await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamPort = (upstream.address() as AddressInfo).port;
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${upstreamPort}/v1`;

  const { createApp } = await import('./app.js');
  usageStoreModule = await import('./services/usageStore.js');

  appServer = createApp().listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => appServer.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(appServer.address() as AddressInfo).port}`;
});

beforeEach(() => {
  fakeOpenAi.status = 200;
  fakeOpenAi.delayMs = 0;
  fakeOpenAi.payload = openAiResponsePayload();
  fakeOpenAi.requests = [];
  usageStoreModule.setUsageStoreForTests(new usageStoreModule.MemoryUsageStore());
});

after(async () => {
  usageStoreModule?.setUsageStoreForTests(null);
  appServer?.closeAllConnections();
  upstream.closeAllConnections();
  await new Promise((resolve) => (appServer ? appServer.close(resolve) : resolve(null)));
  await new Promise((resolve) => upstream.close(resolve));
});

test('GET /health responds ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('unknown routes return a JSON 404', async () => {
  const response = await fetch(`${baseUrl}/nope`);
  assert.equal(response.status, 404);
  const json = (await response.json()) as JsonRecord;
  assert.equal(json.error.code, 'not_found');
});

test('ask requires a valid anonymous client id', async () => {
  const missing = await postAsk({ clientId: null });
  assert.equal(missing.status, 400);
  assert.equal(missing.json.error.code, 'INVALID_CLIENT_ID');

  const invalid = await postAsk({ clientId: 'not-a-uuid' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.json.error.code, 'INVALID_CLIENT_ID');

  assert.equal(fakeOpenAi.requests.length, 0);
});

test('ask rejects an invalid question', async () => {
  const result = await postAsk({ body: askBody({ question: 'short' }) });
  assert.equal(result.status, 400);
  assert.equal(result.json.error.code, 'INVALID_REQUEST');
  assert.equal(fakeOpenAi.requests.length, 0);
});

test('ask rejects an oversized total passage payload', async () => {
  const passages = Array.from({ length: 4 }, (_, index) => ({
    reference: `PSA.23.${index + 1}`,
    displayReference: `Psalm 23:${index + 1}`,
    text: 'a'.repeat(1000),
  }));
  const result = await postAsk({ body: askBody({ passages }) });
  assert.equal(result.status, 413);
  assert.equal(result.json.error.code, 'payload_too_large');
  assert.equal(fakeOpenAi.requests.length, 0);
});

test('ask returns a model answer and consumes one daily ask', async () => {
  const clientId = randomUUID();

  const freshUsage = await getUsage(clientId);
  assert.equal(freshUsage.status, 200);
  assert.equal(freshUsage.json.limit, 3);
  assert.equal(freshUsage.json.used, 0);
  assert.equal(freshUsage.json.remaining, 3);

  const result = await postAsk({ clientId });
  assert.equal(result.status, 200);
  assert.ok(result.json.requestId);
  assert.equal(result.json.safetyLevel, 'standard');
  assert.equal(result.json.answer.summary, modelAnswer().summary);
  assert.equal(result.json.answer.scriptures[0].reference, PASSAGE_REFERENCE);
  assert.equal(result.json.answer.safetyNote, '');
  assert.deepEqual(
    { limit: result.json.usage.limit, used: result.json.usage.used, remaining: result.json.usage.remaining },
    { limit: 3, used: 1, remaining: 2 },
  );

  // The real OpenAI SDK called our fake upstream with the structured request.
  assert.equal(fakeOpenAi.requests.length, 1);
  const upstreamRequest = fakeOpenAi.requests[0]!;
  assert.equal(upstreamRequest.method, 'POST');
  assert.equal(upstreamRequest.url, '/v1/responses');
  assert.equal(upstreamRequest.body.model, 'gpt-e2e-test');
  assert.equal(upstreamRequest.body.text.format.type, 'json_schema');
  assert.ok((upstreamRequest.body.input[1].content as string).includes(askBody().question));

  const afterUsage = await getUsage(clientId);
  assert.equal(afterUsage.json.used, 1);
  assert.equal(afterUsage.json.remaining, 2);
});

test('daily ask limit blocks the fourth ask', async () => {
  const clientId = randomUUID();

  for (let index = 0; index < 3; index += 1) {
    const result = await postAsk({ clientId });
    assert.equal(result.status, 200);
  }

  const fourth = await postAsk({ clientId });
  assert.equal(fourth.status, 429);
  assert.equal(fourth.json.error.code, 'DAILY_ASK_LIMIT');
  assert.equal(fourth.json.error.limit, 3);
  assert.equal(fourth.json.error.usage.used, 3);
  assert.equal(fakeOpenAi.requests.length, 3);
});

test('upstream failure returns a safe error and releases the reservation', async () => {
  const clientId = randomUUID();
  fakeOpenAi.status = 400;

  const failed = await postAsk({ clientId });
  assert.equal(failed.status, 500);
  assert.equal(failed.json.error.code, 'server_error');

  const usage = await getUsage(clientId);
  assert.equal(usage.json.used, 0);
  assert.equal(usage.json.remaining, 3);

  fakeOpenAi.status = 200;
  const retried = await postAsk({ clientId });
  assert.equal(retried.status, 200);
});

test('answers citing unsupplied scripture are rejected', async () => {
  const clientId = randomUUID();
  fakeOpenAi.payload = openAiResponsePayload(modelAnswer({
    scriptures: [{ reference: 'GEN.1.1', reason: 'This reference was never supplied by the client.' }],
  }));

  const result = await postAsk({ clientId });
  assert.equal(result.status, 500);
  assert.equal(result.json.error.code, 'server_error');

  const usage = await getUsage(clientId);
  assert.equal(usage.json.used, 0);
});

test('concurrent asks from one client are blocked', async () => {
  const clientId = randomUUID();
  fakeOpenAi.delayMs = 250;

  const [first, second] = await Promise.all([
    postAsk({ clientId }),
    postAsk({ clientId }),
  ]);

  const statuses = [first.status, second.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 429]);
  const blocked = first.status === 429 ? first : second;
  assert.equal(blocked.json.error.code, 'ASK_ALREADY_IN_PROGRESS');
});

test('per-ip rate limit returns 429 after the window allowance', async () => {
  const clientId = randomUUID();
  const ip = nextIp();

  for (let index = 0; index < 20; index += 1) {
    const result = await getUsage(clientId, ip);
    assert.equal(result.status, 200);
  }

  const limited = await getUsage(clientId, ip);
  assert.equal(limited.status, 429);
  assert.equal(limited.json.error.code, 'RATE_LIMITED');
});
