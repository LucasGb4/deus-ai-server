const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Servidor Divino Online');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log("Minecraft conectado!");

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

                console.log(`Pedido de ${jogador}: ${pedido}`);

                const prompt = `
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
                    const response = await fetch(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-goog-api-key": GEMINI_KEY
                            },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }]
                            })
                        }
                    );

                    const result = await response.json();
                    const texto_resposta = result.candidates[0].content.parts[0].text;
                    const linhas = texto_resposta.split('\n');

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
                            console.log(`Comando enviado: ${comando}`);
                        }
                    });

                } catch (error) {
                    console.error("Erro na IA:", error);
                }
            }
        }
    });

    ws.on('close', () => console.log("Minecraft desconectado."));
    ws.on('error', (err) => console.error("Erro:", err.message));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});