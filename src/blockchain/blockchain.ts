import { Block, calculateHash } from './block';
import { broadcastLatest } from '../p2p/connect';
import { hexToBinary } from '../util';

const BLOCK_GENERATION_INTERVAL: number = 10;

const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10;

const getCurrentTimestamp = (): number => Math.round(new Date().getTime() / 1000);

const genesisHash: string = calculateHash(0, null, getCurrentTimestamp(), 'genesis', 0, 0);

const genesisBlock: Block = new Block(0, genesisHash, null, getCurrentTimestamp(), 'goob', 0, 0);

let blockchain: Block[] = [genesisBlock];

const getBlockchain = (): Block[] => blockchain;

const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

const calculateHashForBlock = (block: Block): string => {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
}

const findBlock = (index: number, previousHash: string, timestamp: number, data: string, difficulty: number): Block => {
  let nonce = 0;
  while (true) {
    const hash: string = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
    }
    nonce++;
  }
};

const getDifficulty = (aBlockchain: Block[]): number => {
  const latestBlock: Block = aBlockchain[blockchain.length - 1];
  if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
    return getAdjustedDifficulty(latestBlock, aBlockchain);
  } else {
    return latestBlock.difficulty;
  }
};

const getAdjustedDifficulty = (latestBlock: Block, aBlockchain: Block[]): number => {
  const prevAdjustmentBlock: Block = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected: number = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken: number = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return prevAdjustmentBlock.difficulty + 1;
  } else if (timeTaken > timeExpected * 2) {
    return prevAdjustmentBlock.difficulty - 1;
  } else {
    return prevAdjustmentBlock.difficulty;
  }
};

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
  return ( previousBlock.timestamp - 60 < newBlock.timestamp )
      && newBlock.timestamp - 60 < getCurrentTimestamp();
}

const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const difficulty: number = getDifficulty(getBlockchain());
  console.log('difficulty: ' + difficulty);
  const nextIndex: number = previousBlock.index + 1;
  const nextTimestamp: number = getCurrentTimestamp();
  const newBlock: Block = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
  addBlockToChain(newBlock);
  broadcastLatest();
  return newBlock;
};

const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('invalid index');
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash');
    return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
    console.log('invalid hash: ', calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
    return false;
  }
  return true;
}

const isValidBlockStructure = (block: Block): boolean => {
  return typeof block.index === 'number'
      && typeof block.hash === 'string'
      && typeof block.previousHash === 'string'
      && typeof block.timestamp === 'number'
      && typeof block.data === 'string';
};

const isValidChain = (blockchainToValidate: Block[]): boolean => {
  const isValidGenesis = (block: Block): boolean => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };
  if (!isValidGenesis(blockchainToValidate[0])) {
    return false;
  }
  for (let i = 1; i < blockchainToValidate.length; i++) {
    if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
      return false;
    }
  }
  return true;
}

const addBlockToChain = (newBlock: Block) => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock);
    return true;
  }
  return false;
};

const replaceChain = (newBlocks: Block[]) => {
  if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
    blockchain = newBlocks;
    broadcastLatest();
  } else {
    console.log('Received blockchain invalid');
  }
};

const hashMatchesDifficulty = (hash: string, difficulty: number): boolean => {
  const hashInBinary: string = hexToBinary(hash);
  const requiredPrefix: string = '0'.repeat(difficulty);
  return hashInBinary.startsWith(requiredPrefix);
};


export {addBlockToChain, generateNextBlock, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain};