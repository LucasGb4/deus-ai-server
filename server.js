const http = require('http');
const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PORT = process.env.PORT || 8080;

const server = http.createServer();
const wss = new WebSocket.Server({ 
    server,
    perMessageDeflate: false
});

wss.on('connection', (ws) => {
    setTimeout(() => {
        ws.send(JSON.stringify({
            "header": {
                "version": 1,
                "requestId": "00000000-0000-0000-0000-000000000000",
                "messagePurpose": "subscribe",
                "messageType": "commandRequest"
            },
            "body": {
                "eventName": "PlayerMessage"
            }
        }));
    }, 500);

    ws.on('message', async (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        if (data.header && data.header.eventName === 'PlayerMessage') {
            const texto = data.body.message.toLowerCase();
            
            if (texto.startsWith("deus ")) {
                const pedido = texto.substring(5).trim();
                const jogador = data.body.sender || "Jogador";

                const promptDivino = `
Você é a I.A. Deus Suprema do Minecraft Bedrock versão 1.26.
O jogador ${jogador} fez o seguinte pedido: "${pedido}".

REGRAS OBRIGATÓRIAS:
- Use APENAS sintaxe válida do Minecraft Bedrock 1.26
- NUNCA use NBT tags
- NUNCA use comandos exclusivos do Java Edition
- Use coordenadas relativas com ~ sempre que possível
- Máximo de 10 comandos por resposta
- Apenas os comandos, um por linha, sem texto explicativo

Comandos permitidos: /fill, /summon, /setblock, /effect, /weather, /give, /tp, /time, /gamemode
                `;

                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-3.1-flash-lite',
                        contents: promptDivino,
                    });

                    const linhas = response.text.split('\n');

                    linhas.forEach(linha => {
                        const comando = linha.trim();
                        if (comando.startsWith('/')) {
                            ws.send(JSON.stringify({
                                "body": {
                                    "commandLine": comando
                                },
                                "header": {
                                    "requestId": Math.random().toString(36).substring(2),
                                    "messagePurpose": "commandRequest",
                                    "version": 1
                                }
                            }));
                        }
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(PORT);
});
