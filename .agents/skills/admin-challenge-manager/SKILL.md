---
name: admin-challenge-manager
description: Cria, mantém e audita rotas, Server Actions e interfaces administrativas (/admin) protegidas por senha para cadastro de músicas e agendamento de desafios diários.
---

# Admin & Challenge Manager — Diretrizes de Execução

Use esta skill sempre que o usuário solicitar criação, alteração ou manutenção no painel administrativo (`/admin`), cadastro de músicas no catálogo ou agendamento de desafios diários.

## 1. Arquitetura de Autenticação (Sem Banco de Usuários)
- Toda rota ou Server Action administrativa deve validar a sessão comparando um cookie `httpOnly` (`lyric_admin_session`) com `process.env.ADMIN_PASSWORD`.
- Nunca busque ou serialize dados sensíveis do banco em Server Components antes de confirmar `verifyAdminAuth() === true`.
- Exija que `ADMIN_PASSWORD` esteja documentada no `.env.example` e validada como não-vazia no servidor.

## 2. Regras de Cadastro de Músicas (`songs`)
- Ao criar ou editar uma música, sempre gere automaticamente o campo `search_index` concatenando `${title} ${artist}`, removendo acentos/diacríticos (`normalize('NFD').replace(/[\u0300-\u036f]/g, '')`) e convertendo para `lowercase`.
- Valide campos obrigatórios (`title`, `artist`, `releaseYear`, `genre`) antes de persistir no banco.

## 3. Regras de Agendamento (`daily_challenges`)
- Utilize operação de `upsert` indexada por `challenge_date` (formato `YYYY-MM-DD`), permitindo reagendar uma data existente sem gerar erro de chave duplicada.
- Preencha automaticamente `hint_3_metadata` com `{ artist, year, genre }` extraídos do registro da música selecionada em `songs`, evitando inconsistência de metadados.
- Trate datas considerando o fuso horário `America/Sao_Paulo` para evitar deslocamento de dia (off-by-one) na gravação UTC do banco.

## 4. Padrão de Interface e Feedback
- Utilize **Next.js Server Actions** com `revalidatePath('/admin')` após mutações no banco.
- Todo formulário administrativo deve exibir feedback claro de sucesso ou erro e desabilitar o botão de envio (`disabled`) enquanto a mutação estiver em andamento.