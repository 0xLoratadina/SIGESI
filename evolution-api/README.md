# Evolution API - WhatsApp para SIGESI

## Configuracion

1. Copiar el archivo de entorno:
```bash
cp .env.example .env
```
2. Editar `.env` y configurar tu `EVOLUTION_API_KEY`.

## Iniciar

```bash
cd evolution-api
docker compose up -d
```

## Detener

```bash
docker compose down
```

## Ver logs

```bash
docker compose logs -f evolution-api
```

## Acceso

- **API:** http://localhost:8085
- **API Key:** La configurada en tu archivo `.env`

## Crear instancia de WhatsApp

```bash
curl -X POST http://localhost:8085/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "sigesi", "qrcode": true}'
```

## Obtener QR Code

```bash
curl http://localhost:8085/instance/qrcode/sigesi \
  -H "apikey: $EVOLUTION_API_KEY"
```

## Enviar mensaje

```bash
curl -X POST http://localhost:8085/message/sendText/sigesi \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number": "521XXXXXXXXXX", "text": "Hola desde SIGESI"}'
```
