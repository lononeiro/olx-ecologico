# ECOnecta Mobile

App Expo / React Native do ECOnecta. Consome a mesma API do web (Next.js) hospedada em `https://olx-ecologico.vercel.app/`.

## Stack

- Expo SDK 57
- React Native 0.86
- Expo Router (typed routes)
- TanStack Query
- Zod
- expo-secure-store (tokens de autenticacao mobile)

## Configuracao local

```bash
npm install
npm run start
```

Comandos uteis (`package.json`):

```bash
npm run dev       # expo start
npm run start     # expo start
npm run android   # expo run:android (builda e instala em device/emulador conectado)
npm run ios       # expo run:ios
npm run web       # expo start --web
```

## Identificacao do app

- package Android: `com.econecta.mobile`
- bundle iOS: `com.econecta.mobile`
- slug EAS: `econecta-mobile`
- projectId EAS: `3c5e2276-1a7b-466b-bf67-f1f861e038f8`

## Gerando o APK Android

Existem dois caminhos: build na nuvem via EAS (mais simples, nao exige nada instalado na maquina) ou build local via Gradle (mais rapido para iterar depois do setup inicial, mas exige Android SDK + JDK na maquina).

### Opcao A: EAS Build (nuvem)

Requer estar logado numa conta Expo (`npx eas-cli login`).

```bash
npx eas-cli build --platform android --profile preview
```

O profile `preview` (ver `eas.json`) ja esta configurado para gerar `.apk` (em vez de `.aab`), assinado automaticamente pela EAS. O link de download aparece no final do build.

Profiles disponiveis em `eas.json`:

- `development`: apk de dev client, distribuicao interna
- `preview`: apk assinado, distribuicao interna
- `production`: build de producao (gera `.aab` para a Play Store)

### Opcao B: Build local (Gradle)

#### 1. Pre-requisitos (uma vez so)

- JDK 17
- Android SDK (platform-tools, `platforms;android-36`, `build-tools;36.0.0`)
- Variaveis de ambiente: `JAVA_HOME`, `ANDROID_HOME` (e `ANDROID_SDK_ROOT`)

No Windows, se nada disso estiver instalado ainda:

```powershell
# JDK 17
winget install --id EclipseAdoptium.Temurin.17.JDK -e

# Android SDK command-line tools
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null
Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile "$env:TEMP\cmdline-tools.zip"
Expand-Archive -Path "$env:TEMP\cmdline-tools.zip" -DestinationPath "$env:TEMP\cmdline-tools-extract" -Force
New-Item -ItemType Directory -Force -Path "$sdkRoot\cmdline-tools" | Out-Null
Move-Item -Force "$env:TEMP\cmdline-tools-extract\cmdline-tools" "$sdkRoot\cmdline-tools\latest"

# variaveis de ambiente permanentes (usuario)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot", "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$sdkRoot", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$sdkRoot", "User")
# adicione $sdkRoot\platform-tools, $sdkRoot\cmdline-tools\latest\bin e o bin do JDK ao PATH do usuario

# aceitar licencas e instalar pacotes (abra um terminal novo antes, para JAVA_HOME/ANDROID_HOME valerem)
& "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
& "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

Depois desse setup, feche e reabra o terminal para as variaveis de ambiente valerem.

#### 2. Gerar o projeto nativo Android

O projeto e "managed" por padrao (sem pasta `android/` versionada). Para buildar localmente, gere a pasta nativa com o prebuild do Expo:

```bash
npx expo prebuild -p android --no-install
```

Isso cria `apps/mobile/android/`. Rodar de novo sobrescreve customizacoes manuais nessa pasta, entao evite editar arquivos dentro de `android/` a mao — prefira `app.json`/plugins do Expo.

#### 3. Buildar o APK

```bash
cd android
.\gradlew.bat assembleRelease   # Windows
./gradlew assembleRelease       # macOS/Linux
```

Na primeira vez demora bastante (baixa o Gradle e todas as dependencias — ~30min dependendo da conexao). Nas proximas builds, com o cache local do Gradle, fica bem mais rapido.

O APK fica em:

```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

**Assinatura:** por padrao o build type `release` usa a mesma keystore de debug (`android/app/debug.keystore`), o que e suficiente para testes e distribuicao interna. Para publicar na Play Store e necessario gerar uma keystore propria de release e configurar `signingConfigs.release` em `android/app/build.gradle` (ver https://reactnative.dev/docs/signed-apk-android).

**Testar direto num device/emulador** sem gerar o APK manualmente:

```bash
npx expo run:android
```

## Autenticacao mobile

Diferente do web (NextAuth com sessao de navegador), o mobile usa endpoints dedicados de autenticacao (`/api/auth/mobile/login`, `/api/auth/mobile/refresh`) com access token + refresh token, armazenados via `expo-secure-store`.

## Notificacoes push

O app registra o push token do device (`lib/push.ts`) e envia para `POST /api/notificacoes/push-token`. A tela `app/notificacoes.tsx` e o `NotificationsContext` cuidam de exibir/marcar notificacoes lidas e suprimir notificacoes do chat que ja esta aberto.
