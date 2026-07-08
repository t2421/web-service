import type { AuthSession } from "@/server/domain/auth";

export interface SessionGateway {
  getSession(): Promise<AuthSession | null>;
  // 呼び出し元リクエストのセッションをサーバー側で失効させる (cookie 削除)。
  // アカウント削除など、クライアントの signOut 呼び出しに依存できない場面で使う。
  destroySession(): Promise<void>;
}
