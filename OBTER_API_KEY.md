# 🔑 Encontrando a Chave JWT do Supabase

## ⚠️ Chaves Diferentes

Você me enviou as chaves no formato **novo** (com prefixo):
- `sb_publishable_...` 
- `sb_secret_...`

Mas para o JavaScript client, precisamos da chave no formato **JWT** (JSON Web Token).

---

## ✅ Como Encontrar a Chave JWT

### Opção 1: Mesma Página de API

1. Acesse: https://rsgzhywafuftizmpvuwy.supabase.co
2. Vá em **Settings** → **API**
3. **Role a página para baixo** até a seção **"Project API keys"**
4. Você verá:

```
Project API keys

anon
[Reveal button] eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

service_role
[Reveal button] eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Clique em **Reveal** na chave **`anon`** (NÃO a service_role)
6. Copie TODA a chave (ela começa com `eyJ...`)

### Opção 2: Configuração do Projeto

1. Na mesma página **Settings** → **API**
2. Procure por **"Configuration"** ou **"Project Configuration"**
3. Você verá algo como:

```javascript
const supabaseUrl = 'https://rsgzhywafuftizmpvuwy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

4. Copie o valor de `supabaseKey`

---

## 🎯 O Que Estou Procurando

A chave deve:
- ✅ Começar com `eyJ`
- ✅ Ter 3 partes separadas por pontos (`.`)
- ✅ Ser BEM LONGA (200+ caracteres)
- ✅ Parecer algo assim:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZ3poeXdhZnVmdGl6bXB2dXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NzI2NjksImV4cCI6MjA1NTA0ODY2OX0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 📸 Screenshot de Onde Encontrar

Na página **Settings → API**, role até ver:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project API keys
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These keys are used to bypass Row Level Security. Never share them publicly.

anon
public  This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies.
[Reveal] eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ← COPIE ESTA!

service_role  
secret  This key has the ability to bypass Row Level Security. Never share it publicly.
[Reveal] eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ← NÃO use esta
```

---

## ⏭️ Depois de Copiar

Me envie a chave que começa com `eyJ...` e eu atualizo o código!
