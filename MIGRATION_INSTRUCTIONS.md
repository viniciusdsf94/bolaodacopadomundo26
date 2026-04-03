# Como Executar a Migração do Perfil

## Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto: `bfhlgexfuyymyvbizawq`
3. Vá para **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/setup_profiles.sql`
6. Cole na editor
7. Clique em **Run**

Se tudo funcionar, você verá mensagens de sucesso.

## Opção 2: Via Supabase CLI

```bash
# 1. Certifique-se que tem Supabase CLI instalado
# npm install -g supabase

# 2. Navegue até a pasta do projeto
cd /path/to/bolaodacopadomundo26

# 3. Execute a migração
supabase db push
```

## Opção 3: Via Migration File

Se você quer usar as migrations:

```bash
# 1. Certifique-se que as migrações estão em supabase/migrations/
# - 20260329155120_a9742804-6649-42ab-9456-7d6d14b888c5.sql (já existe)
# - 20260401000000_create_profiles_table.sql (agora)
# - 20260401000001_create_profile_trigger.sql (agora)

# 2. Push as migrações
supabase db push
```

## O que será criado:

✅ **Tabela `profiles`** com:
- `id` (UUID) - Referencia o usuário
- `first_name` (TEXT)
- `last_name` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

✅ **RLS Policies** para:
- Usuários poderem ver seus próprios dados
- Usuários poderem atualizar seus próprios dados
- Usuários poderem inserir seus próprios dados

✅ **Trigger Automático** que:
- Cria um perfil vazio quando um novo usuário se registra
- Isso garante que sempre existe um perfil associado

## Depois que executar:

1. Volte para a aplicação
2. Tente fazer um novo registro
3. A conta e perfil devem ser criados com sucesso
4. Você será redirecionado ao dashboard

## Se ainda houver erros:

1. Verifique o console do navegador (F12)
2. Procure por mensagens de erro
3. Confirme que a tabela `profiles` foi criada no SQL Editor do Supabase
