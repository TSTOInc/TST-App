import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.CONVEX_ENCRYPTION_KEY;

// Encrypt a message
export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

// Decrypt a message
export function decrypt(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    return "[decryption failed]";
  }
}
