const T = {
  OP_RETURN: 1,
};

const M = new Uint8Array(32);
let MP = 1;

const uint8_t = 8;

const free = (index) => {
  let start = index - 1;
  const len = M[start];
  while (start++ < len) {
    M[start] = 0;
  }
};

const realloc = (index, size) => {
  M[MP] = size;
  let start = index - 1;
  const len = M[start];
  M[start++] = 0;
  const p = MP + 1;
  while (start < len) {
    if (p === M.length) return null;
    M[p] = M[start];
    M[start] = 0;
    start++;
    p++;
  }

  MP = p;

  return p - len;
};

const reallocate = (index, oldSize, newSize) => {
  if (newSize === 0) {
    free(index, oldSize);
    return null;
  }

  const result = realloc(index, newSize);
  if (result === null) process.exit(1);
  return result;
};
const GROW_CAPACITY = (capacity) => (capacity < 8 ? 8 : capacity * 2);
const GROW_ARRAY = (size, index, oldCount, newCount) =>
  reallocate(index, oldCount, newCount);
const FREE_ARRAY = (size, index, oldCount) => reallocate(index, oldCount, 0);

const makeChunk = () => ({ count: 0, capacity: 0, index: null });

const initChunk = (chunk) => {
  chunk.count = 0;
  chunk.capacity = 0;
  chunk.index = null;
};

const writeChunk = (chunk, byte) => {
  if (chunk.capacity < chunk.count + 1) {
    const oldCapacity = chunk.capacity;
    chunk.capacity = GROW_CAPACITY(chunk.capacity);
    chunk.index = GROW_ARRAY(uint8_t, chunk.index, oldCapacity, chunk.capacity);
  }

  M[chunk.index + chunk.count] = byte;
  chunk.count++;
};

const freeChunk = (chunk) => {
  FREE_ARRAY(uint8_t, chunk.index, chunk.capacity);
  initChunk(chunk);
};

const main = () => {
  const c = makeChunk();
  initChunk(c);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);
  writeChunk(c, T.OP_RETURN);

  console.log(M, c);
  freeChunk(c);

  return 0;
};

main();
