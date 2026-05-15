export const metadata = {
  title: "メールを確認してください",
};

export default function VerifyPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">メールを確認してください</h1>
      <p className="text-sm text-muted-foreground">
        サインインリンクをメールでお送りしました。受信箱と迷惑メールフォルダをご確認ください。
      </p>
    </div>
  );
}
