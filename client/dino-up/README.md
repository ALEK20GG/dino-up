# Deploy su Render

## Struttura
```
client/   → Static Site su Render
server/   → Web Service su Render
```

---

## 1. Deploy Backend (Web Service)

1. Crea un nuovo **Web Service** su Render
2. Collega il repo (o carica la cartella `server/`)
3. Impostazioni:
   - **Runtime**: Node
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Dopo il deploy, copia l'URL del servizio (es. `tuo-backend.onrender.com`)

---

## 2. Aggiorna l'URL nel client

In `client/main.js`, riga 7, sostituisci:
```js
: "wss://tuo-backend.onrender.com"
```
con il tuo URL reale, es.:
```js
: "wss://mio-gioco-server.onrender.com"
```

---

## 3. Deploy Frontend (Static Site)

1. Crea un nuovo **Static Site** su Render
2. Collega il repo (o carica la cartella `client/`)
3. Impostazioni:
   - **Root Directory**: `client`
   - **Publish Directory**: `.`
   - **Build Command**: (lascia vuoto)

---

## ⚠️ Note

- Su piano **gratuito** Render il backend si spegne dopo 15 min di inattività
- I WebSocket usano `wss://` (sicuro) in produzione, `ws://` in locale
