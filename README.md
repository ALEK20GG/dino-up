# Dino Up 🦕

Un multiplayer 3D in tempo reale dove controlli un dinosauro in un mondo condiviso. Muovi il tuo dino, salta e interagisci con altri giocatori!

## 🚀 Quick Start

### 1. Setup Locale
 **Avvia il client**:
   - Apri `client/index.html` con **Live Server** (VS Code extension)
   - Oppure usa qualsiasi server HTTP locale

### 2. Gioca!

- **Movimento**: WASD o Left Stick
- **Telecamera**: Mouse o Right Stick
- **Salto**: Spazio o A/B (controller)
- **Pointer Lock**: Clicca per catturare il mouse

## 🌐 Server Pubblico

Il server è già deployato su **Render**:
- URL: `wss://dino-up.onrender.com`
- Su piano gratuito, si spegne dopo 15 minuti di inattività

## 📁 Struttura Progetto

```
dino-up/
├── client/           # Frontend Three.js
│   ├── index.html    # Pagina principale
│   ├── main.js       # Logica principale + WebSocket
│   ├── player.js     # Classe Player + fisica
│   ├── camera.js     # Controlli telecamera
│   ├── input.js      # Gestione input (tastiera + controller)
│   ├── scene.js      # Setup Three.js + caricamento mappa
│   └── player/       # Modelli GLB del dinosauro
├── server/           # Backend Node.js
│   ├── server.js     # WebSocket server
│   └── package.json  # Dipendenze
└── README.md         # Questo file
```

## 🛠️ Tecnologie

- **Frontend**: Three.js, WebGL
- **Backend**: Node.js, WebSocket (ws)
- **3D Models**: GLB
- **Networking**: WebSocket per stato in tempo reale
- **Fisica**: Raycasting per collisioni e terreno

## 🎮 Controlli

| Azione | Tastiera | Controller |
|--------|----------|------------|
| Movimento | WASD | Left Stick |
| Telecamera | Mouse | Right Stick |
| Salto | Spazio | A / B |
| Pointer Lock | Click | - |

## ⚠️ Note

- **Live Server obbligatorio**: Il client carica risorse locali, serve un server HTTP
- **WebSocket sicuro**: Usa `wss://` in produzione, `ws://` in locale
- **Performance**: Ottimizzato per 60 FPS, ma dipende dall'hardware
- **Browser**: Chrome/Firefox consigliati per WebGL

## 🔧 Sviluppo

Per modificare il codice:
1. Client: modifica file in `client/`
2. Server: modifica `server/server.js`
3. Testa sempre con Live Server per il client

## 📝 TODO

- [ ] Aggiungere più mappe
- [ ] Sistema di chat
- [ ] Effetti particellari
- [ ] Suoni ambientali
- [ ] Mobile support
- [ ] Aggiungere Crobu skin

---

**Divertiti con Dino Up! 🦕🎮**
