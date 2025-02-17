export function generateRandomId(): string {
  const timestamp = new Date().getTime();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${randomPart}-${timestamp}`;
}
