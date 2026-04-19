# DepositRescue — Infra notes (Matu)

Estado al 2026-04-19: journal compartido funcionando entre Matu y Feli vía Tailscale + Postgres local.

## Dónde vive qué (Matu's PC)

| Componente | Path / comando |
|---|---|
| Postgres data | `C:\Program Files\PostgreSQL\17\data` |
| Postgres service | `postgresql-x64-17` (auto-start) |
| Config file | `C:\Users\matia\.depositrescue\config.json` (author=matu) |
| Passwords | `C:\Users\matia\.depositrescue\pg_super.txt`, `pg_journal.txt` (chmod restringido) |
| CLI source | `C:\Users\matia\.depositrescue\journal-cli\` |
| Init SQL | `C:\Users\matia\.depositrescue\init.sql` |
| Firewall rule | `DepositRescue Postgres (Tailscale)` → TCP 5432 desde 100.64.0.0/10 |
| Tailscale IP | `100.82.217.45` |

## Cuando subas el repo depositRescue a GitHub

Mové el CLI al repo:

```bash
mkdir -p <repo>/tools/journal-cli
cp C:\Users\matia\.depositrescue\journal-cli\{package.json,index.js,README.md} <repo>/tools/journal-cli/
cp C:\Users\matia\.depositrescue\init.sql <repo>/tools/journal-cli/
# agregá al .gitignore del repo:
#   tools/journal-cli/node_modules/
#   .depositrescue/
```

Y en `CLAUDE.md` del repo, la sección de convención (ver `SETUP-FELI.md`).

## Pasar la password a Feli

La password del rol `journal` está en `C:\Users\matia\.depositrescue\pg_journal.txt`. Mandala por Signal/WhatsApp (NO por email ni Discord). Es rotable: si algo se filtra, corré:

```bash
# desde la PC de Matu, PowerShell:
$PG_SUPER = Get-Content C:\Users\matia\.depositrescue\pg_super.txt
$NEW_PASS = [Convert]::ToBase64String((1..18 | ForEach-Object {Get-Random -Min 0 -Max 256}))
$env:PGPASSWORD = $PG_SUPER
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -d depositrescue -c "ALTER ROLE journal PASSWORD '$NEW_PASS';"
$NEW_PASS | Out-File C:\Users\matia\.depositrescue\pg_journal.txt
```

Y actualizá tu `config.json` + mandale la nueva a Feli.

## Troubleshooting

**Feli no puede conectar:**
1. Ambos con Tailscale up? (`tailscale status` en ambos)
2. Postgres corriendo? `sc query postgresql-x64-17` → STATE: RUNNING
3. Firewall rule activa? `Get-NetFirewallRule -DisplayName "DepositRescue Postgres (Tailscale)"`
4. Listening en 0.0.0.0? `netstat -an | grep 5432`
5. pg_hba.conf tiene la línea de Tailscale? (`C:\Program Files\PostgreSQL\17\data\pg_hba.conf`, línea con `100.64.0.0/10`)

**PC de Matu se reinicia:**
- Postgres service auto-arranca.
- Tailscale auto-conecta.
- Nada que hacer, debería levantar solo.

**Tailscale IP cambia:**
- Normalmente no cambia dentro de la misma tailnet, pero si pasa: actualizar `config.json` de Feli con la nueva IP. Alternativa: usar el nombre DNS de MagicDNS (`<machine-name>.<tailnet>.ts.net`) en vez de la IP.

## Migración a Supabase (opcional, post-hackathon)

Si en algún momento se quiere mover de Postgres local a Supabase (ej: descentralizar):

```bash
# dump
pg_dump -U postgres -h localhost -d depositrescue -t agent_journal -t agent_state > dump.sql
# restore al Supabase
psql "postgresql://postgres:<sb-pass>@<sb-host>:5432/postgres" < dump.sql
# cambiar config.json de ambos: host → Supabase host, port, password
```

Schema es idéntico; solo cambia el endpoint.
