const { redisClient } = require("../utils/redisUtils");
const { createTransactionRequestWithOutbox } = require('../dao');

const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';
const PENDING_TTL_SECONDS = 60;
const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 7;
const keyFor = (idempotencyKey) => `${IDEMPOTENCY_KEY_PREFIX}${idempotencyKey}`;
const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

/**
 * Standard response shape returned to controllers:
 * - { ok: true,  status: 'accepted', requestId, data }  // first time success
 * - { ok: true,  status: 'pending' }                    // rare race condition or duplicate
 *
 * Controller can map:
 * - 'accepted' -> 202 Accepted
 * - 'pending'  -> 202 Accepted
 */

async function createTransactionRequest(fromAccountId, toAccountId, amount, idempotencyKey) {
  const redisKey = keyFor(idempotencyKey);
  console.log(`[Idempotency] Incoming request: from=${fromAccountId}, to=${toAccountId}, amount=${amount}, key=${idempotencyKey}`);
  console.log(`[Idempotency] Computed Redis key: ${redisKey}`);

  // 1) Fast idempotency check: try to create a PENDING placeholder (JSON) with TTL

  let setResult = null;
  try {
    console.log(`[Idempotency] Attempting Redis SET NX with pending status, TTL=${PENDING_TTL_SECONDS}s`);
    setResult = await redisClient.set(
      redisKey,
      JSON.stringify({ status: 'pending' }),
      {
        NX: true,
        EX: PENDING_TTL_SECONDS
      }
    );
    console.log(`[Idempotency] Redis SET NX result:`, setResult);
  } catch (e) {
    console.error('[Idempotency] Redis is down or errored, proceeding without fast-cache check:', e);
  }

  // 2) Duplicate path: key already exists -> return original snapshot/status

  if (setResult === null) {
    console.log(`[Idempotency] Redis key already exists, checking existing value...`);
    const cachedRaw = await redisClient.get(redisKey);
    console.log(`[Idempotency] Raw cached value:`, cachedRaw);
    const cached = safeParse(cachedRaw);
    console.log(`[Idempotency] Parsed cached value:`, cached);

    if (cached && cached.status === 'accepted') {
        console.log(`[Idempotency] Found accepted snapshot in Redis, returning it.`);
        return cached.snapshot;
    }

    console.log(`[Idempotency] No accepted snapshot found, returning pending status.`);
    return { ok: true, status: 'pending' };
  }

  // 3) New request path: do the atomic DB write + outbox

  try {
    console.log(`[Idempotency] No existing Redis key, proceeding with DB insert...`);
    const newRequest = await createTransactionRequestWithOutbox(
      fromAccountId,
      toAccountId,
      amount,
      idempotencyKey
    );
    console.log(`[Idempotency] DB insert successful. New request ID: ${newRequest.id}`);

    // Build the canonical response snapshot we’ll return now AND to duplicates later

    const responseSnapshot = {
      ok: true,
      status: 'accepted',
      requestId: newRequest.id,
      data: newRequest,
    };

    console.log(`[Idempotency] Writing accepted snapshot to Redis with TTL=${SNAPSHOT_TTL_SECONDS}s`);
    try {
      snapshotResult = await redisClient.set(
        redisKey,
        JSON.stringify({
          status: 'accepted',
          requestId: newRequest.id,
          snapshot: responseSnapshot,
        }),
        {
          EX: SNAPSHOT_TTL_SECONDS
        }
      );
      console.log(`[Idempotency] Snapshot write result:`, snapshotResult);
    } catch (err) {
      console.error(`[Idempotency] Error writing snapshot to Redis:`, err);
    }

    return responseSnapshot;
  } catch (error) {
    console.error(`[Idempotency] Error during DB insert:`, error);
    try { 
      console.log(`[Idempotency] Cleaning up Redis key due to error.`);
      await redisClient.del(redisKey); 
    } catch (delErr) {
      console.error(`[Idempotency] Failed to delete Redis key after error:`, delErr);
    }

    if (error.code === '23505' && error.constraint === 'transaction_requests_idempotency_key_key') {
      const duplicateError = new Error('Duplicate idempotency key');
      duplicateError.type = 'DuplicateIdempotencyKeyError';
      throw duplicateError;
    }

    throw error; 
  }
}

module.exports = { createTransactionRequest };

