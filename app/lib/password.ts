export function generateTempPassword(length = 14) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[values[i] % chars.length];
  }

  return password;
}