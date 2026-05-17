import { container } from "@/server/container";

const { GET, POST } = container().authHandlers;
export { GET, POST };
