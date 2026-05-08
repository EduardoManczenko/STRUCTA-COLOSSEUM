# STRUCTA – Frontend (Next.js)

Frontend público + dashboards (investidor, incorporadora, admin) da plataforma STRUCTA, conectado ao backend NestJS e ao Supabase.

## Stack
- **Next.js 15 (App Router)** + React 19
- **Tailwind CSS** + design tokens compatíveis com `manual-light/dark.html`
- **Framer Motion** para micro-interações
- **Solana Wallet Adapter** (Phantom, Solflare e WalletConnect-ready) com login via assinatura
- **Sonner** para toasts e **next-themes** para light/dark mode futuro

## Áreas

| Rota | Quem acessa | Descrição |
| --- | --- | --- |
| `/` | Público | Landing page com CTAs para empreendimentos, cadastro de incorporadora e parceiros aprovados |
| `/empreendimentos` | Público | Listagem com busca/filtro por status |
| `/empreendimentos/[idOrSlug]` | Público | Página detalhada com galeria, tokenomics, documentos, smart contracts |
| `/cadastro/incorporadora` | Público | Formulário multi-step de submissão (vai para fila de aprovação) |
| `/login` | Público | Login email/senha (admin / incorporadora aprovada) |
| `/dashboard` | Investidor (wallet) | Visão geral, lista de empreendimentos e posições |
| `/dashboard/empreendimentos` | Investidor | Catálogo navegável |
| `/dashboard/cotas` | Investidor | Saldo por empreendimento + histórico de compras |
| `/dashboard/yields` | Investidor | Histórico de distribuições |
| `/incorporadora` | Incorporadora aprovada | Visão geral, status de aprovação |
| `/incorporadora/empreendimentos` | Incorporadora | Lista dos empreendimentos próprios |
| `/incorporadora/empreendimentos/[id]` | Incorporadora | Detalhes + andamento da venda quando aprovado |
| `/incorporadora/novo-empreendimento` | Incorporadora | Formulário multi-step com upload de imagens/docs |
| `/incorporadora/perfil` | Incorporadora | Dados, certificações e responsável |
| `/incorporadora/documentos` | Incorporadora | Documentos por empreendimento |
| `/admin` | Admin | KPIs e atalhos para aprovações e multisig |
| `/admin/empreendimentos` | Admin | Lista com filtros |
| `/admin/empreendimentos/[id]` | Admin | Controles multisig 3/5 (aprovar, abrir/fechar venda, distribuir yield, sacar fundo, lock/unlock burn, refund, criar contratos) |
| `/admin/incorporadoras` | Admin | Lista, com aprovar/recusar |
| `/admin/incorporadoras/[id]` | Admin | Análise completa + decisão |
| `/admin/aprovacoes` | Admin | Fila unificada (incorporadoras + empreendimentos pendentes) |
| `/admin/multisig` | Admin | Histórico das propostas multisig |

## Wallet & autenticação

- O componente `ConnectWalletButton` abre o modal do Wallet Adapter, conecta a wallet, pede um nonce ao backend (`POST /auth/wallet/nonce`), assina via `signMessage` e troca pela JWT (`POST /auth/wallet/verify`).
- O JWT (Supabase para admin/incorporadora ou nosso JWT custom para investidores) é persistido em `localStorage` (`structa.token`).

## Compra de cotas

`BuyCotaModal` orquestra o fluxo:
1. Quantidade (calcula total a pagar)
2. Compliance Chainalysis (`POST /compliance/screen`) – wallet pode ser bloqueada
3. Revisão final
4. Confirmação (`POST /purchases/confirm`) – mock-mint via backend

## Multisig

O painel admin cria propostas (`POST /admin/proposals`) que somam assinaturas (`POST /admin/proposals/:id/sign`). Quando atinge 3/5 assinaturas, o backend executa a ação mockada do contrato.

## Uploads
Implementados via **signed upload URLs** do Supabase Storage para não trafegar arquivos pela função serverless da Vercel:

```
POST /files/upload-url -> { signed_url, token, path }
PUT  signed_url        (direto Supabase)
POST /files/download-url -> signed read URL (5min) ou pública
```

Buckets habilitados: `development-images`, `development-documents`, `incorporator-documents`, `incorporator-logos`.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Build

```bash
npm run build
```

Tudo é estático/serverless-friendly e pronto para deploy na Vercel.
