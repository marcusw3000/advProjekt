# TODO

## Pendente

### Resend — falta domínio próprio
`RESEND_API_KEY` já configurada no `.env`, reset de senha funcional. `EMAIL_FROM` está em `onboarding@resend.dev` (sandbox Resend — só entrega pra emails verificados na conta, limite baixo). Falta: verificar domínio próprio no dashboard Resend e trocar `EMAIL_FROM` pra endereço do domínio (ex: `no-reply@seudominio.com`).

### Modelo de crédito — reserva de minutos na criação (não só no débito)
Hoje o saldo só é debitado quando o vídeo *conclui* (`debitMinutesForCompletedVideo`, chamado em `finalizeJob.ts`). O check de saldo na criação (`POST /api/videos`) é só um gate, não uma reserva — não há bloqueio de minutos no momento da criação. Isso significa: usuário pode criar N vídeos concorrentes, todos passam no check de saldo (nenhum debitou ainda), e todos completarem depois pode deixar o saldo negativo. Mitigado (não eliminado) pelo rate limit de 10 vídeos/hora por usuário. Correção completa exigiria: coluna `reservedMinutes` (ou similar) no `User`, debitar/reservar no momento da criação dentro da mesma transação serializable já aplicada em `videos/route.ts`, e reembolsar em `handleJobFailure.ts` quando o job falha definitivamente. É mudança de schema (migration) — não aplicada ainda, aguardando confirmação.

## Feito

- **Sentry** — conta+projeto configurados (org `vagao`, projeto `javascript-nextjs`). DSN, auth token (User Auth Token com escopo `project:read` — Organization Auth Tokens `sntrys_...` não servem, dão 403) e org/project no `.env`. Feed de erros em `/admin/observabilidade` testado e funcionando.
- **Dashboard de admin** — `/admin` com layout dedicado (`AdminShell`), 4 seções: Visão Geral, Usuários (toggle admin, ajuste manual de saldo), Jobs (saúde do cron/pipeline, histórico via `CronRun`, taxa de falha), Observabilidade (feed Sentry + gráficos de uso/dia). Admin de teste: `npm run create-admin` (`admin@lexscript.test` / `Admin123!`).
- **Rate limiting** — Upstash Redis configurado e testado. Ligado em login (5/5min por IP+email), signup (3/hora por IP), forgot-password (3/hora por IP), upload/criação de vídeo (10/hora por usuário). Fail-open se env vars ausentes.
- **Retry com backoff** — `TranscriptionJob` ganhou `attemptCount`/`nextRetryAt`. 3 tentativas automáticas (5/15/45min) antes de falhar terminal, centralizado em `src/lib/jobs/handleJobFailure.ts` (usado por `processJob`, `finalizeJob` e o timeout de job travado no cron). Na falha definitiva, email pro dono do vídeo + todos os admins via Resend. Retry manual (`/api/videos/[id]/retry`) zera o contador (retry "de graça" fora da política). Testado contra o banco real: 3 retries com backoff certo, falha terminal na 4ª.
- **Ticket de suporte** — `/suporte` agora tem form (assunto+mensagem), grava `SupportTicket` no banco, notifica admins por email, rate limit 5/hora por usuário. `/admin/suporte` lista tickets com toggle aberto/fechado.
- **Testes** — 32 passando (21 antigos + 6 de `retryPolicy` + 5 de `supportTicketSchema`).
