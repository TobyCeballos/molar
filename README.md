# MOLAR

MVP local-first para gestión odontológica. El backend Spring Boot usa SQLite y Flyway; el frontend React se sirve embebido/desktop y los datos quedan fuera de la instalación, en `%APPDATA%/Molar`.

## Desarrollo

Requisitos: Java 21, Maven, Node.js 20+ y npm.

```powershell
cd backend
mvn spring-boot:run
cd ..\frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`. En la primera ejecución se crea el usuario ADMIN. No hay credenciales hardcodeadas.

## Build

```powershell
cd frontend; npm install; npm run build
cd ..\backend; mvn clean package
```

El MVP incluye login local con BCrypt, pacientes y búsqueda, agenda diaria, dashboard, migración inicial Flyway, auditoría básica y persistencia local. La estructura para el shell desktop está en `desktop/`; el empaquetado debe incluir `backend/target/molar-backend-1.0.0.jar` y `frontend/dist` como recursos de Electron.

## Releases y actualización

La distribución prevista es GitHub Releases, nunca `git pull` en el consultorio. El workflow debe compilar el frontend/backend, empaquetar el jar junto con Electron y publicar `Molar-Setup.exe` más su SHA-256. La actualización debe ejecutarse en un proceso externo que respete `%APPDATA%/Molar` y cree un backup previo.

El alcance actual no incluye todavía: adjuntos, odontograma, restauración de backups, update checker implementado, instalador firmado, workflow de release completo ni bundle de JRE. Se dejan explícitamente fuera del primer corte porque necesitan decisiones de distribución y pruebas en Windows; SQLite, Flyway y la separación de datos ya están preparadas para incorporarlos sin mover la base.
