# 📁 Base de Datos de la Aplicación

Este directorio contiene todo lo necesario para inicializar y alimentar la base de datos de la aplicación para un entorno de desarrollo local.

## ⚙️ Estándar del Equipo

Para mantener la consistencia en todos los entornos de desarrollo, se ha definido el siguiente estándar:

-   **Motor de Base de Datos**: MySQL `8.0.x`
-   **Character Set**: `utf8mb4`
-   **Collation**: `utf8mb4_0900_ai_ci` (sensible a acentos y mayúsculas/minúsculas)
-   **Timezone (TZ)**: `UTC`
-   **Credenciales Estándar**:
    -   **Database**: `appdb`
    -   **User**: `appuser`
    -   **Password**: `apppass`

## 🚀 Comandos de Uso

Asegúrate de tener el cliente de MySQL instalado en tu máquina.

### a) Creación de DB y Usuario (Solo la primera vez)

Este comando prepara la base de datos y el usuario con los privilegios necesarios. Solo necesitas ejecutarlo una vez en tu máquina local.

```bash
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS fraudfishing CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppass';
GRANT ALL PRIVILEGES ON fraudfishing.* TO 'appuser'@'%';
FLUSH PRIVILEGES;"
```

Para rellenar la primera vez, correr estos 