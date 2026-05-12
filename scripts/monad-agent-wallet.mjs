import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { homedir } from "node:os";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const keystorePath = `${homedir()}/.monskills/keystore/agent-wallet.json`;
const password = process.env.MONAD_AGENT_WALLET_PASSWORD ?? "";

export async function loadOrCreateAgentAccount() {
  if (!existsSync(keystorePath)) {
    await mkdir(dirname(keystorePath), { recursive: true });
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    await writeFile(keystorePath, JSON.stringify(encryptPrivateKey(privateKey), null, 2));
    return { account, created: true, keystorePath };
  }

  const keystore = JSON.parse(await readFile(keystorePath, "utf8"));
  const privateKey = decryptPrivateKey(keystore);
  return { account: privateKeyToAccount(privateKey), created: false, keystorePath };
}

function encryptPrivateKey(privateKey) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 1,
    kdf: "scrypt",
    cipher: "aes-256-gcm",
    address: privateKeyToAccount(privateKey).address,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    ciphertext: encrypted.toString("hex"),
  };
}

function decryptPrivateKey(keystore) {
  const key = scryptSync(password, Buffer.from(keystore.salt, "hex"), 32);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(keystore.iv, "hex"));
  decipher.setAuthTag(Buffer.from(keystore.tag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(keystore.ciphertext, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { account, created, keystorePath: path } = await loadOrCreateAgentAccount();
  console.log(JSON.stringify({
    address: account.address,
    created,
    keystorePath: path,
    fundWith: "Monad testnet MON",
  }, null, 2));
}
