# Setup para Feli — Journal compartido

Matu ya levantó un Postgres en su PC con un túnel Tailscale. Vos te conectás como cliente para que tu Claude Code y el de Matu puedan leer/escribir en un log compartido (`agent_journal`) mientras trabajan.

## Requisitos

- Node.js 18+ (lo vas a tener igual por Next.js)
- Tailscale (se instala acá abajo)
- Una cuenta Google/GitHub/Microsoft para logear Tailscale

## Pasos

### 1. Tailscale

**Mac:**
```bash
brew install --cask tailscale
open -a Tailscale
# logear con la misma cuenta con la que Matu te invitó
```

**Windows:**
```powershell
winget install Tailscale.Tailscale
& "C:\Program Files\Tailscale\tailscale.exe" up
```

Matu tiene que invitarte a su tailnet desde https://login.tailscale.com/admin/users (acción: "Invite to tailnet"). Cuando aceptes la invitación, tu PC y la de Matu se ven por la red privada.

Verificar:
```bash
tailscale status
# deberías ver la PC de Matu (100.82.217.45)
ping 100.82.217.45
```

### 2. Journal CLI

```bash
git clone https://github.com/P4niikK/DepositRescue.git
cd DepositRescue/tools/journal-cli
npm install
npm link
```

### 3. Config local

Pedile a Matu la password del rol `journal` por Signal/WhatsApp. Después creá `~/.depositrescue/config.json`:

```json
{
  "host": "100.82.217.45",
  "port": 5432,
  "user": "journal",
  "password": "<PEDILE A MATU>",
  "database": "depositrescue",
  "author": "feli"
}
```

```bash
chmod 600 ~/.depositrescue/config.json
```

### 4. Probar

```bash
journal ping
# OK host=100.82.217.45 user=journal ...

journal write --task="setup-journal" --kind=note --notes="feli online"
journal read --limit=10
```

Si `ping` falla:
- `tailscale status` — confirmá que ves a Matu en la lista
- `ping 100.82.217.45` — confirmá que la PC de Matu está prendida y en la tailnet
- Matu puede verificar en su lado que el service Postgres esté corriendo: `sc query postgresql-x64-17`

## Convención de uso (para tu Claude Code)

Agregá esto al `CLAUDE.md` del repo (Matu lo va a poner):

> **Shared journal protocol.**
> - Antes de arrancar una unidad de trabajo, correr `journal read --since=8h` para ver qué hizo el otro.
> - Al empezar una tarea no trivial: `journal write --task="<nombre>" --kind=started`.
> - Al terminarla: `journal write --task="<nombre>" --kind=finished --notes="<resumen>" --files=<paths>`.
> - Si quedás blocked: `journal write --task="<nombre>" --kind=blocked --notes="<por qué>"`.
> - Para anunciar un cambio de scope o decisión arquitectónica: `kind=decision`.
> - Para estado compartido (scope actual, estados cubiertos, etc): `journal state set` / `journal state get`.

## Seguridad

- El rol `journal` solo tiene INSERT/SELECT/UPDATE sobre `agent_journal` y `agent_state`. No puede crear tablas ni tocar otras DBs.
- Postgres solo acepta conexiones desde `100.64.0.0/10` (subnet Tailscale). El firewall de Windows bloquea todo lo demás en el puerto 5432.
- Si perdés acceso a tu PC o Feli deja el proyecto, Matu rota la password del rol `journal` y actualiza los configs.
