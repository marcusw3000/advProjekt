# TODO

## Pendente

### Resend — falta domínio próprio
`RESEND_API_KEY` já configurada no `.env`, reset de senha funcional. `EMAIL_FROM` está em `onboarding@resend.dev` (sandbox Resend — só entrega pra emails verificados na conta, limite baixo). Falta: verificar domínio próprio no dashboard Resend e trocar `EMAIL_FROM` pra endereço do domínio (ex: `no-reply@seudominio.com`).

### Modelo de crédito — reserva de minutos na criação (não só no débito)
Hoje o saldo só é debitado quando o vídeo *conclui* (`debitMinutesForCompletedVideo`, chamado em `finalizeJob.ts`). O check de saldo na criação (`POST /api/videos`) é só um gate, não uma reserva — não há bloqueio de minutos no momento da criação. Isso significa: usuário pode criar N vídeos concorrentes, todos passam no check de saldo (nenhum debitou ainda), e todos completarem depois pode deixar o saldo negativo. Mitigado (não eliminado) pelo rate limit de 10 vídeos/hora por usuário. Correção completa exigiria: coluna `reservedMinutes` (ou similar) no `User`, debitar/reservar no momento da criação dentro da mesma transação serializable já aplicada em `videos/route.ts`, e reembolsar em `handleJobFailure.ts` quando o job falha definitivamente. É mudança de schema (migration) — não aplicada ainda, aguardando confirmação.

### Stripe — pagamento real ainda não integrado
`MinutesTransaction` já tem campos nullable `amountCents`/`currency` (preparados na aba Financeiro), e `.env.example` tem placeholders comentados (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Falta o resto: checkout flow, webhook handler com verificação de assinatura, definição de planos/preços. Card "Receita" no `/admin/financeiro` já lida com o estado "sem dados" até isso existir.

## Feito

- **Sentry** — conta+projeto configurados (org `vagao`, projeto `javascript-nextjs`). DSN, auth token (User Auth Token com escopo `project:read` — Organization Auth Tokens `sntrys_...` não servem, dão 403) e org/project no `.env`. Feed de erros em `/admin/observabilidade` testado e funcionando.
- **Dashboard de admin** — `/admin` com layout dedicado (`AdminShell`), 6 seções: Visão Geral, Usuários (toggle admin, ajuste manual de saldo), Financeiro (ledger de minutos/créditos com filtros/paginação e drill-down por usuário em `/admin/financeiro/[userId]`), Jobs (saúde do cron/pipeline, histórico via `CronRun`, taxa de falha), Observabilidade (feed Sentry + gráficos de uso/dia), Suporte. Admin de teste: `npm run create-admin -- <email> <senha>` (sem valor padrão — exige argumentos explícitos, senha mínimo 8 caracteres).
- **Rate limiting** — Upstash Redis configurado e testado. Ligado em login (5/5min por IP+email), signup (3/hora por IP), forgot-password (3/hora por IP), upload/criação de vídeo (10/hora por usuário). Fail-open se env vars ausentes.
- **Retry com backoff** — `TranscriptionJob` ganhou `attemptCount`/`nextRetryAt`. 3 tentativas automáticas (5/15/45min) antes de falhar terminal, centralizado em `src/lib/jobs/handleJobFailure.ts` (usado por `processJob`, `finalizeJob` e o timeout de job travado no cron). Na falha definitiva, email pro dono do vídeo + todos os admins via Resend. Retry manual (`/api/videos/[id]/retry`) zera o contador (retry "de graça" fora da política). Testado contra o banco real: 3 retries com backoff certo, falha terminal na 4ª.
- **Ticket de suporte** — `/suporte` agora tem form (assunto+mensagem), grava `SupportTicket` no banco, notifica admins por email, rate limit 5/hora por usuário. `/admin/suporte` lista tickets com toggle aberto/fechado.
- **Testes** — 32 passando (21 antigos + 6 de `retryPolicy` + 5 de `supportTicketSchema`).



Passo a passo pra configurar R2:

1. Criar bucket
Cloudflare dashboard → R2 Object Storage → Create bucket. Nome ex: advprojekt-videos. Região: Automatic.

2. Domínio público (necessário — CSP e playback dependem disso)
Bucket → Settings → Public Access → Custom Domains → conecta um domínio/subdomínio seu (ex: cdn.seudominio.com) que já esteja na Cloudflare. Isso vira R2_PUBLIC_URL.

Sem domínio próprio dá pra usar r2.dev subdomain (Settings → Public Access → "Enable r2.dev subdomain"), mas é rate-limited e não recomendado pra produção.

3. API Token (credenciais S3)
Dashboard → R2 → Manage R2 API Tokens → Create API Token.

Permission: Object Read & Write
Scope: restringe ao bucket específico criado
Copia Access Key ID e Secret Access Key na hora — secret só aparece uma vez.
4. Account ID
Dashboard R2 → canto direito mostra Account ID (ou em qualquer domínio → Overview lateral direita).

5. Preencher .env

R2_ACCOUNT_ID="seu-account-id"
R2_ACCESS_KEY_ID="access-key-do-token"
R2_SECRET_ACCESS_KEY="secret-key-do-token"
R2_BUCKET="advprojekt-videos"
R2_PUBLIC_URL="https://cdn.seudominio.com"
6. CORS no bucket (importante — upload é direto browser→R2)
Bucket → Settings → CORS Policy → adiciona:


[
  {
    "AllowedOrigins": ["https://seu-app.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
Sem isso o fetch(uploadUrl, {method:"PUT"}) do browser vai falhar com erro CORS.

7. Testar

npm run dev
Sobe um vídeo pela UI (/videos/new), confere no bucket (R2 dashboard → bucket → objetos) se apareceu em videos/{userId}/{uuid}/original.ext.

Quer que eu confirme os valores no .env local depois de você preencher, ou já testo o upload assim que colocar as credenciais?