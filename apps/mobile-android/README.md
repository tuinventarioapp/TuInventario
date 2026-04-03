# TuInventario Mobile

App Android beta que envuelve la version web de TuInventario para que el celular vea la misma interfaz, los mismos cambios y la misma base de datos.

## Como funciona

- Si defines `TUINVENTARIO_MOBILE_WEB_URL`, la app abre esa URL de TuInventario directamente.
- Si no viene configurada, al abrir el APK por primera vez te pide pegar la URL publica de tu app web.

## Generar APK

1. Define la URL publica de tu web si quieres dejarla embebida:

```powershell
$env:TUINVENTARIO_MOBILE_WEB_URL="https://tu-url-publica-de-tuinventario"
```

2. Genera el APK:

```powershell
cd apps/mobile-android
gradle assembleDebug
```

3. APK resultante:

`app/build/outputs/apk/debug/app-debug.apk`

## Notas

- La app soporta navegacion, subida de archivos y descargas basicas.
- Si tu backend y frontend estan en una URL publica, cualquier cambio que publiques en la web se refleja tambien en la app movil.
