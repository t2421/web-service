// JSON カラムへ安全に書ける値だけを許可する (Date やクラスインスタンスの混入を型で防ぐ)。
export type AuditMetadata = Readonly<Record<string, string | number | boolean | null>>;

export type AuditEntry = Readonly<{
  userId: string | null;
  action: string;
  metadata?: AuditMetadata;
}>;

// 監査ログの書き込み口。失敗しても業務処理を止めない(実装側で握り潰して logger に流す)。
export interface AuditLogger {
  record(entry: AuditEntry): Promise<void>;
}
