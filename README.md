# 🛡️ CuadrantePro - Gasteiz de Vigilancia

Sistema web profesional para la planificación y automatización de cuadrantes de turnos de seguridad privada, con cálculo automático de horas nocturnas y festivas (incluidos sábados), cómputo anual (1 de enero a 31 de diciembre), estimación de nóminas según convenio, sincronización con Google Calendar y exportación oficial a PDF y Excel.

---

## 🚀 Puesta en Marcha Local

### Requisitos previos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- `npm` (incluido con Node.js)

### Instalación y ejecución
1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

3. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos listos para producción se generarán en la carpeta `dist/`.

4. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

---

## 🐙 Cómo subir este proyecto a GitHub

Si deseas subir este proyecto a un nuevo repositorio en tu cuenta de GitHub, sigue estos sencillos pasos desde la terminal:

1. **Inicializar Git:**
   ```bash
   git init
   ```

2. **Añadir todos los archivos y hacer el primer commit:**
   ```bash
   git add .
   git commit -m "feat: versión inicial Cuadrante Gasteiz de Vigilancia"
   ```

3. **Vincular con tu repositorio de GitHub:**
   *(Reemplaza `tu-usuario` y `nombre-del-repo` con los de tu repositorio creado en GitHub)*
   ```bash
   git branch -M main
   git remote add origin https://github.com/tu-usuario/nombre-del-repo.git
   ```

4. **Subir los cambios:**
   ```bash
   git push -u origin main
   ```

---

## 🌐 Despliegue Gratuito en GitHub Pages

El proyecto incluye un flujo automático de **GitHub Actions** en `.github/workflows/deploy.yml`.

Para tener la web funcionando gratis en Internet con tu enlace de GitHub:
1. Ve a tu repositorio en GitHub.
2. Entra en **Settings** > **Pages** (en el menú lateral izquierdo).
3. En la sección **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. ¡Listo! En 1-2 minutos tu aplicación estará publicada en:  
   `https://tu-usuario.github.io/nombre-del-repo/`

> **Nota:** La configuración en `vite.config.ts` ya tiene `base: './'`, lo que garantiza que todas las fuentes, estilos y scripts carguen perfectamente sin importar la ruta o subcarpeta en la que esté alojado.

---

## ☁️ Despliegue en Vercel o Netlify (Alternativa)

También puedes desplegar la aplicación con un solo clic conectando tu repositorio de GitHub a:
- **[Vercel](https://vercel.com/)**: Detecta automáticamente Vite.
  - *Build Command:* `npm run build`
  - *Output Directory:* `dist`
- **[Netlify](https://www.netlify.com/)**:
  - *Build Command:* `npm run build`
  - *Publish Directory:* `dist`

---

## 📋 Características Principales

- **Gestión Visual de Cuadrantes**: Matriz mensual intuitiva basada en arrastrar y soltar (Drag & Drop), o modo brocha para pintar turnos con un clic.
- **Personalización Total de Turnos**: Posibilidad de poner y quitar cualquier turno de la paleta con modal de confirmación en la papelera.
- **Convenio de Seguridad Adaptable**:
  - Cómputo de horas mensuales ordinarias (162h base).
  - Cómputo anual del **1 de enero al 31 de diciembre incluidos** (1.782h).
  - Horas nocturnas calculadas de 22:00 a 06:00.
  - **Sábados, domingos y festivos** computados automáticamente como festivos con plus retributivo.
  - Añadido de conceptos retributivos adicionales (Peligrosidad, Transporte, Vestuario, etc.).
- **Fila de Cobertura Diaria**: Supervisión en tiempo real de que el servicio de 24 horas está completamente cubierto.
- **Exportación Oficial con Logotipo**:
  - **PDF Oficial**: Cuadrante maquetado en horizontal (A4) con el escudo corporativo de *Gasteiz de Vigilancia*, leyenda y casillas de firma.
  - **Excel / CSV**: Formato compatible con Microsoft Excel con codificación UTF-8.
  - **Informe de Nómina**: Desglose económico para el departamento de administración/RRHH.
- **Portal del Vigilante (Móvil)**: Vista optimizada para teléfonos móviles con resumen de próximo turno y cuenta atrás.
- **Sincronización con Google Calendar / Gmail**: Permite añadir los turnos directamente a la agenda personal de Google o descargar el archivo `.ICS` para Android e iOS.
- **Alertas Push**: Notificaciones locales para recordar el inicio del servicio al vigilante.

---

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite 8** (con soporte ESM y rutas relativas)
- **Tailwind CSS 4**
- **Lucide React** (Iconografía)
- **jsPDF** (Generación de cuadrantes en PDF)
- **Firebase Auth** (Sincronización con Google Workspace API)

---

## 📄 Licencia

Uso interno para la gestión de turnos de vigilancia y seguridad privada.
