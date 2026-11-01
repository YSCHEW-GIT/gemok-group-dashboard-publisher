# GitHub Pages 画面デグレ防止ルール

## 目的

売上・在庫データの自動更新や画面修正の際に、GitHub Pagesの画面が古い版へ戻ることを防止する。

この文書は、GEMOKダッシュボードのUI、Collector、自動公開、GitHub Actionsを変更するすべての担当者・AIエージェントが従う必須ルールである。

## 基本原則

- UIと自動更新データを分離する。
- UIの正本は site/canonical-index.html と site/assets/** とする。
- 非公開Siteの現行公開版を機能・表示の比較基準とする。
- Collectorは売上・在庫などのデータだけを更新し、UIを更新しない。
- テストに失敗した変更はGitHub Pagesへデプロイしない。
- 古いUIを自動マージで復活させない。

## ファイルの所有範囲

| パス | 用途 | 更新方法 |
|---|---|---|
| site/canonical-index.html | GitHub Pages UIの正本 | 画面リリース時だけ更新 |
| site/assets/** | UI画像・アイコンの正本 | 画面リリース時だけ更新 |
| dist/index.html | Pagesデプロイ用生成物 | GitHub Actionsが正本から生成 |
| dist/assets/** | Pagesデプロイ用生成物 | GitHub Actionsが正本から生成 |
| site/index.html | Collectorとの互換用コピー | Pagesの正本として使用しない |
| dist/dashboard-data.json | 最新売上データ | Collectorが自動更新可能 |
| dist/dashboard-data/** | 月別売上データ | Collectorが自動更新可能 |
| dist/inventory-data.json | 最新在庫データ | Collectorが自動更新可能 |
| .github/workflows/** | 公開・検査処理 | 管理者による画面リリース時だけ更新 |

## 必須対策

### 1. UIと自動更新データを完全分離する

Collectorの公開処理はデータファイルだけをコピーする。次のパスを自動更新処理から除外する。

- index.html
- assets/**
- site/canonical-index.html
- .github/workflows/**

GitHub Pagesは、デプロイ時に必ず site/canonical-index.html と site/assets/** から公開用 dist を構築する。

### 2. 競合時の自動マージを禁止する

画面やワークフローを巻き戻す可能性があるため、Collectorで次を使用しない。

- git merge -X ours
- git push --force
- 分岐した履歴の自動解決

Git同期はfast-forward可能な場合だけ続行する。履歴が分岐している場合は公開を停止し、人が確認する。

### 3. デプロイ前の回帰テストを必須にする

GitHub Actionsで次を検査し、1件でも失敗した場合はPagesを更新しない。

- 売上進捗画面が表示される。
- グループ概要が「工事中」ではない。
- 在庫状況の商品グループが表示される。
- 目標設定画面が表示される。
- システム設定画面が表示される。
- 年表画像がHTTP 200で取得できる。
- 表示画像の naturalWidth が0より大きい。
- JavaScriptの未処理エラーがない。
- PC幅とスマートフォン幅で横方向の重大な表示崩れがない。

### 4. 自動更新コミットの変更範囲を検査する

コミット名が Publish dashboard data ... の場合、変更を許可するのはデータファイルだけとする。

HTML、CSS、JavaScript、画像、GitHub Actionsが含まれた場合は、デプロイ前に失敗させる。

### 5. 正常版へのロールバックを用意する

- 最後に全回帰テストを通過したUIコミットSHAを記録する。
- 公開後テストが失敗した場合は、そのUIコミットから再デプロイする。
- ロールバック時も最新の売上・在庫JSONは維持する。
- 正常版が確認できない場合は、新しいUIを公開せず現在のPagesを維持する。

## 画面修正時の必須手順

1. 非公開Siteの最新公開バージョンと対象画面を確認する。
2. 変更対象と影響画面を列挙する。
3. UI正本だけを修正する。
4. 売上進捗、グループ概要、在庫状況、目標設定、システム設定を確認する。
5. 年表画像など、すべての変更対象画像の読込完了を確認する。
6. GitHub Actionsの回帰テストを通過させる。
7. GitHub Pagesを公開する。
8. 公開URLで全5画面とブラウザコンソールを確認する。
9. 次の自動データ更新後も同じUIが維持されることを確認する。

## 自動更新処理を変更する場合の必須手順

1. 自動更新が触るファイル一覧を確認する。
2. UI正本、画像、ワークフローが一覧に含まれていないことを確認する。
3. データ更新だけを含むテストコミットを作成する。
4. GitHub Pagesの全5画面が変更前と同じであることを確認する。
5. 失敗時はpushせず、エラーとして停止する。

## 禁止事項

- GitHub上の dist/index.html だけを直接修正する。
- Collectorのデータ更新とUI更新を同じ処理で行う。
- 非公開SiteとGitHub Pagesのどちらか一方だけを確認して完了とする。
- 回帰テストを省略して「表示できるはず」と判断する。
- 競合を ours、theirs、force pushで自動解決する。
- 公開後確認前に作業完了と報告する。

## リリースチェックリスト

- [ ] 非公開Siteの現行画面を確認した
- [ ] UI正本以外のHTMLを直接修正していない
- [ ] 自動更新コミットにUIファイルが含まれていない
- [ ] 売上進捗を確認した
- [ ] グループ概要を確認した
- [ ] 在庫状況を確認した
- [ ] 目標設定を確認した
- [ ] システム設定を確認した
- [ ] 画像のHTTP応答と実寸を確認した
- [ ] PC表示を確認した
- [ ] スマートフォン表示を確認した
- [ ] JavaScriptエラーがない
- [ ] GitHub Actionsが成功した
- [ ] GitHub Pagesの公開URLを確認した
- [ ] 次回の自動データ更新後もUIが維持された

## 完了条件

コードをpushしただけでは完了ではない。GitHub Pagesの公開URLで全5画面と画像を確認し、さらに自動データ更新後もUIが維持された時点で完了とする。
