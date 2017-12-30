import * as CryptoJS from 'crypto-js';

export const calculateHash = (index: number, previousHash: string, timestamp: number, data: string, difficulty: number, nonce: number): string => {
  return CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();
};

export class Block {
  public index: number;
  public hash: string;
  public previousHash: string;
  public timestamp: number;
  public data: string;
  public difficulty: number;
  public nonce: number;

  constructor(index: number, hash: string, previousHash: string, timestamp: number, data: string, difficulty: number, nonce: number) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}