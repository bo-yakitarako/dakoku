# dakokuアプリサーバー化要件
現状だと仮のログインフォームを持つ`AuthApp`と`auth.html`のウィンドウがあり、このウィンドウで初期構築を終えた`server`以下のAPIサーバーとの通信を行っていて、既にサーバー化が進んでいるように見えてしまうが、`AuthApp`のウィンドウについてはあくまで仮のものであって今後進めていきたい実装とは別件であることに留意する

## 主目的
現在`desktop`内で実装されている打刻アプリの打刻時刻に関するデータの管理を`electron-store`のローカル管理から`server`ディレクトリ以下で実装するAPIサーバーと接続するSupabaseのDBでの管理に移行する

## UX
既に実装されている画面やUIについては特に変更は加えない。ただし、各ウィンドウのロード時に取得するデータについてはメインプロセスでサーバーからAPIを介して取得し、preloadを通してレンダラプロセスでは起動直後から即使用できるようにする。`useEffect`や`atomWithQuery`等でレンダラプロセスから取得するのはなるべく避ける

- 起動時
  - ログイン情報が保持されていない場合: 認証ウィンドウが開く
  - ログイン情報が保持されている場合: 現在実装されているメインウィンドウを開く
- 認証画面
  - デフォルトはログイン画面
    - メールアドレスとパスワードを送信し、ログインに成功した場合は認証ウィンドウが閉じてメインウィンドウが開く
  - ログイン画面下に`パスワードを忘れた`リンクと`新規登録はこちら`リンクがある
  - `パスワードを忘れた`を押すと、TextInputと送信Buttonのみの簡易的なメアド入力画面が開き、入力後は「パスワード再設定メールを送信しました」というメッセージのみの画面となる
    - 入力後、同時にsupabaseからパスワード再設定メールが届く
  - `新規登録はこちら`を押すと、ログイン画面からパスワード再入力のTextInputが増えたフォームとなる
    - メールアドレスとパスワードを入力後に送信すると、「確認メールを送信しました」というメッセージのみの画面と、その下に`ログインはこちら`というボタンを置く
    - `ログインはこちら`を押すとデフォルトのログイン画面に戻る
  - フォームについては適宜`zod`と`react-hook-form`を用いたバリデーションを実装する
- メインウィンドウ
  - 現在の実装と変わらない使用感/UIとする
- カレンダーウィンドウ
  - 現在の実装と概ね変わらない使用感/UIとする
  - timeの登録の無い月については月移動ボタンで移動できないようにする
- 詳細グラフウィンドウ
  - 現在の実装と変わらない使用感/UIとする

## 詳細要件
### 1. 打刻データの管理について
- Supabaseで提供されるPostgreSQLで管理する
- メアドとパスワードによる基礎的な認証によってユーザー情報を確立し、ユーザー毎に打刻データを持つようにする
- Supabaseとの接続は完全に`server`以下に実装されるAPIサーバー内で行うようにし、`desktop`以下で実装されるElectronアプリ上や、今後展開するかもしれないwebアプリやスマホアプリ上では一切Supabaseとの接続は行わない
- SupabaseのDBのpublicスキーマで管理されるこのアプリに関するテーブルに関しては、`uuid`の`id`カラムと一般的な`timestampz`である`created_at`と`updated_at`を必ず持つようにする。`id`についてはレコードのCREATE時にSQL側で自動生成するようにするが、`created_at`と`updated_at`については`Model.ts`によって自動的に操作されるため、SQL側での操作は不要とする
- SupabaseのDBで管理するデータは現状残るjsonのうち以下のものであり、Electronのウィンドウ制御等のElectron上の操作として使用されている`electron-store`についてはDBでは関与しない
  - `workTimes.json`: 過去の打刻時刻のデータが全て保持されたstore
  - `job.json`: 登録されたjobのIDと名前を保持するものと、現在選択されているjobを保持するstore
  - `timeState.json`: 現在進行中のjobを保持しておくstore
- `workTimes.json`でのデータ構造は、`year.month.date.data`の形のJSON形式となっているが、RDBで管理できるようにこの中の`works`に記録されるエポックミリ秒を1レコード単位として扱うようにし、それぞれsupabaseの`auth.user`とのリレーションを持つ`user_id`とjobとのリレーションを持つ`job_id`および、`year`、`month`、`date`のintカラムと、何回目の勤務なのかを示すintの`index`カラムと記録されるエボックミリ秒に該当する`timestampz`カラムの`acted_at`をカラムとして持つようにしたい。ここで記載の無かった`workTime`と`restTime`はAPIサーバー側で計算すれば用意できるので新たに記録することはしない。テーブル名は`work_times`でいいか
- `timeState.json`の中については`workTimes.json`のデータを保持するテーブルのカラムに現在動いているtimeであるかを判断する`status`カラムを追加すれば同様に機能を維持できるので、ここは余計にテーブルを作成しない
- `job.json`内に保持される2つの情報については、それぞれ別のテーブルで管理するようにする
  - `jobName`: `jobs`というテーブルで、`auth.user`とのリレーションを持つ`user_id`カラムと10文字制限でjob名を記録する`name`カラムを持つ
  - `currentJob`: `auth.user`とのリレーションを持つ`user_id`と、`jobs`とのリレーションを持つ`job_id`カラムを持つ。なおこれは各ユーザーにつき必ず1つなので`user_id`でユニーク制約を課す
- 各テーブルに対応するモデルクラスを`Model.ts`を継承することで追加する。その際の命名はPascalCaseで単数形となるテーブル名とする(例: `work_times`テーブルなら`WorkTime`)
  - このときの各モデルクラスは各テーブルの単一レコードに対するCRUDのみを担当する
  - 各モデルクラスでは、対応するテーブルのテーブル名を指定する: `protected static _tableName = '';`
  - 各モデルクラスでは対応するテーブルのカラムをcamelCaseにしたgetterを定義する
- joinや複雑なselectを要するクエリを叩く場合は`Repository.ts`を継承したリポジトリクラスを用いる(例: `WorkTimeRepository`)
- `WorkTimeRepository`では取得した`work_times`テーブルの全レコードのデータについてparseし、`workTimes.json`で使用するような`job_id.year.month.date`の形で`works`の配列を取得できるような形に変換する
  - 打刻時間データはこの形でクライアント側に送信するようにする
- 必要なDBの構造については`server\supabase\migrations\20260222235154_remote_schema.sql`に記載する
- 最初のリリースまではDBの構造に変化があっても新たにマイグレーションファイルを作成することはせずに`server\supabase\migrations\20260222235154_remote_schema.sql`ファイルを直接修正し、`pnpm dbreset`を行うことで構造を適用していく
- 現在storeで取り扱うtimeはエポックミリ秒ではあるが、サーバー化にあたって使用するのはtimestampzで表されるZ付きのUTC時間とする
- タイムゾーン運用はAsia/Tokyoを前提とする。DB保存は`timestampz`で行い、クライアントとの通信データでは`dayjs`を用いてエポックミリ秒へ変換して扱う
- その他適宜テーブルのindexや制約は適したものを用意していく
- 同時に進行中の勤務はユーザーごとに1件までとするが、`number[][]`で複数レコードを扱う都合上`user_id/job_id/status`の単純ユニーク制約は設けず、APIサーバー側の検証ロジックで担保する

### 2. データのやり取りについて
`{ [jobId in string]: number[][] }`でのレスポンスで扱う`number`はエポックミリ秒のこととなる。work_timesテーブルで扱うデータとしては`acted_at: timestampz`となるが、クライアントにレスポンスとして送る場合はエポックミリ秒に変換する

- 認証画面: ここでのAPIのみ`accessToken`は不要。逆に言うとこれら以外は`accessToken`を要することになる
  - 認証系APIの詳細な挙動(トークン保持/破棄・通信方式)は既存実装を踏襲する
  - `/auth/register`: 新規登録エンドポイント、登録submit時に送信
    - リクエスト: `{ email: string; password: string }`
    - レスポンス: `null`
  - `/auth/login`: ログインエンドポイント、ログインsubmit時に送信
    - リクエスト: `{ email: string; password: string }`
    - レスポンス: `{ accessToken: string }`
  - `/auth/resetPassword`: emailをリクエストし、パスワード再設定メールを送信させる
    - リクエスト: `{ email: string }`
    - レスポンス: `null`
  - `/auth/logout`: 保持されたcookieとtokenを削除し、ログアウトする
    - リクエスト: `{}`
    - レスポンス: `null`
  - `/auth/refresh`: (使用しないでもOK) 認証トークンを再生成する
    - リクエスト: `{}`
    - レスポンス: `{ accessToken: string }`
- メイン画面
  - ロード時の読み込み
    - `/main/jobs`: 登録したjobを全て返す。セレクトボックスで選択するものとなる
      - リクエスト: `{}`
      - レスポンス: `{ id: string; name: string }[]`
    - `/main/workTimes`: 本日行った全てのjobのtimesを返す
      - リクエスト: `{}`
      - レスポンス: `{ [jobId in string]: number[][] }`
    - `/main/current`: 現在カウント中のjobとworksを返す
      - リクエスト: `{}`
      - レスポンス: `{ jobId: string; works: number[][] } | null`
  - mutateするもの
    - `/main/registerJob`: jobの名前を入力し、新しいjobとして登録する
      - リクエスト: `{ name: string }`
      - レスポンス: `{ id: string; name: string }[]`
    - `/main/editJob`: 選択中のjobの名前を編集して送信する
      - リクエスト: `{ jobId: string; name: string }`
      - レスポンス: `{ id: string; name: string }[]`
    - `/main/deleteJob`: 選択中のjobを削除する
      - リクエスト: `{ jobId: string }`
      - レスポンス: `{ id: string; name: string }[]`
    - 上記3つのjob関連のものはレスポンスが返ってくるまで送信ボタンをloadingとし、レスポンスが返ってきたらダイアログを閉じてセレクトボックスの`jobs`に反映する
    - `/main/postTime`: 開始/休憩/退勤 ボタンを押した際にサーバーに該当timeを送信する
      - リクエスト: `{ jobId: string; index: number; actedAt: number; workStatus: 'working' | 'resting' | 'workOff' }`
      - レスポンス: `{ [jobId in string]: number[][] }`
      - ボタンを押したらレスポンスが返ってくるまでボタンをloadingとし、失敗時はtoastを出してそのままの状態を保持
- カレンダー画面
  - ロード時の読み込み
    - `/calendar/month`: 今月のtimeを全て`workTimes.json`の形式で返す
      - リクエスト: `{}`
      - レスポンス: `{ [jobId in string]: number[][] }`
    - `/calendar/holidays`: 今月の祝日の日付とその祝日名を全て返す
      - リクエスト: `{}`
      - レスポンス: `{ date: number; holidayName: string }[]`
  - 画面内でgetするもの
    - `/calendar/month`: 指定された月のtimeを全て`workTimes.json`の形式で返す
      - リクエスト: `{ year: number; month: number }`
      - レスポンス: `{ [jobId in string]: number[][] }`
    - `/calendar/holidays`: 指定された月の祝日の日付とその祝日名を全て返す
      - リクエスト: `{ year: number; month: number }`
      - レスポンス: `{ date: number; holidayName: string }[]`
  - 現状だと祝日APIから毎回fetchしているけど、`/calendar/holidays`ではサーバーディレクトリのルートディレクトリに`holidays.json`を保存し、基本は`holidays.json`から情報を取得する。`holidays.json`に無い日付が出て来たときのみ祝日APIから追加の日付をfetchし、`holidays.json`に追記するようにする。`holidays.json`は以下のような形となる
    - `{ "2026-02-23": "天皇誕生日", "2026-03-20": "春分の日", ... }`
- 詳細グラフ画面
  - ロード時の読み込み
    - `/dayDetail/times`: 指定された日付のjob毎のtimeを全て返す
      - リクエスト: `{ year: number; month: number; date: number }`
      - レスポンス: `{ [jobId in string]: number[][] }`
