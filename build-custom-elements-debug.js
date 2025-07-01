const fs = require('fs-extra');
const path = require('path');
const { rollup } = require('rollup');
const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');

const buildPath = path.join(__dirname, '../dist/web-components-lib');
const outputPath = path.join(__dirname, '../dist/custom-elements');

async function buildCustomElements() {
  console.log('🚀 Building custom elements...\n');

  try {
    await fs.ensureDir(outputPath);

    if (!await fs.pathExists(buildPath)) {
      throw new Error(`La librería no está compilada. Ejecuta primero: npm run build:web-components`);
    }

    const entryContent = `
import 'zone.js';
import '@angular/compiler';

import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { importProvidersFrom, NgZone, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './fesm2022/web-components-lib.mjs';

async function initializeCustomElements() {
  try {
    console.log('🚀 Iniciando custom elements con providers completos...');
    
    const app = await createApplication({
      providers: [
        importProvidersFrom(CommonModule),
      ]
    });

    const injector = app.injector;
    console.log('✅ Aplicación Angular creada con injector completo');
    
    const ngZone = injector.get(NgZone, null);
    console.log('🔍 NgZone disponible:', !!ngZone);

    const componentsToRegister = [
      { tagName: 'nv-button', component: ButtonComponent }
    ];

    console.log('📝 Registrando componentes...');

    for (const { tagName, component } of componentsToRegister) {
      try {
        if (!customElements.get(tagName)) {
          console.log(\`🔄 Registrando \${tagName}...\`);
          
          if (!component) {
            throw new Error(\`Componente \${tagName} no disponible\`);
          }
          
          const element = createCustomElement(component, { injector });
          customElements.define(tagName, element);
          console.log(\`✅ \${tagName} registrado exitosamente\`);
        } else {
          console.log(\`⚠️  \${tagName} ya registrado\`);
        }
      } catch (compError) {
        console.error(\`❌ Error registrando \${tagName}:\`, compError);
        throw compError;
      }
    }

    console.log('🎉 Registro de componentes completado');
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nativo-components-ready', {
        detail: { 
          components: componentsToRegister.map(c => c.tagName),
          method: 'full-providers',
          ngZone: !!ngZone,
          timestamp: Date.now()
        }
      }));
      
      window.NativoComponents = { 
        initialized: true,
        components: componentsToRegister.map(c => c.tagName),
        version: '1.0.0',
        ngZone: !!ngZone,
        injector: injector
      };
    }
    
  } catch (error) {
    console.error('❌ Error en inicialización principal:', error);
    console.log('🔄 Intentando método de respaldo...');
    
    try {
      await fallbackWithProviders();
    } catch (fallbackError) {
      console.error('❌ Error en método de respaldo:', fallbackError);
      throw new Error(\`Falló completamente: \${error.message}\`);
    }
  }
}

async function fallbackWithProviders() {
  console.log('🆘 Ejecutando método de respaldo con providers...');
  
  try {
    const { 
      createEnvironmentInjector, 
      importProvidersFrom, 
      NgZone,
      ApplicationRef,
      ComponentRef,
      ChangeDetectorRef,
      ElementRef,
      Injector
    } = await import('@angular/core');
    
    const { CommonModule } = await import('@angular/common');
    
    // Crear injector con providers esenciales
    const environmentInjector = createEnvironmentInjector([
      importProvidersFrom(CommonModule),
      // Providers adicionales que podrían ser necesarios
      {
        provide: NgZone,
        useFactory: () => new NgZone({ enableLongStackTrace: false }),
      }
    ], null, 'CustomElementsInjector');
    
    console.log('✅ Environment injector creado con NgZone');
    
    // Verificar NgZone
    const ngZone = environmentInjector.get(NgZone, null);
    console.log('🔍 NgZone en injector de respaldo:', !!ngZone);
    
    // Importar componente
    const { ButtonComponent } = await import('./fesm2022/web-components-lib.mjs');
    
    if (!ButtonComponent) {
      throw new Error('ButtonComponent no disponible');
    }
    
    // Registrar componente
    if (!customElements.get('nv-button')) {
      const element = createCustomElement(ButtonComponent, { injector: environmentInjector });
      customElements.define('nv-button', element);
      console.log('✅ nv-button registrado con método de respaldo');
    }
    
    // Notificar éxito
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nativo-components-ready', {
        detail: { 
          components: ['nv-button'],
          method: 'fallback-with-providers',
          ngZone: !!ngZone,
          timestamp: Date.now()
        }
      }));
      
      window.NativoComponents = { 
        initialized: true,
        components: ['nv-button'],
        method: 'fallback',
        version: '1.0.0',
        ngZone: !!ngZone,
        injector: environmentInjector
      };
    }
    
    console.log('🎉 Método de respaldo exitoso');
    
  } catch (error) {
    console.error('❌ Error en método de respaldo:', error);
    throw error;
  }
}

// Función de verificación mejorada
function checkRegistrationStatus() {
  console.log('=== NATIVO COMPONENTS STATUS ===');
  
  // Verificar custom elements
  const nvButton = customElements.get('nv-button');
  console.log('Custom Elements:');
  console.log('  - nv-button:', nvButton ? '✅ Registrado' : '❌ No registrado');
  
  // Verificar objeto global
  console.log('Global Objects:');
  console.log('  - window.NativoComponents:', window.NativoComponents || 'No disponible');
  
  // Verificar Zone.js
  console.log('Zone.js:');
  console.log('  - Zone global:', typeof Zone !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
  console.log('  - Zone.current:', typeof Zone !== 'undefined' && Zone.current ? '✅ Activo' : '❌ Inactivo');
  
  // Verificar instancias en DOM
  const instances = document.querySelectorAll('nv-button');
  console.log('DOM Instances:');
  console.log('  - Elementos encontrados:', instances.length);
  
  // Probar crear elemento dinámicamente
  try {
    const testElement = document.createElement('nv-button');
    testElement.setAttribute('type-button', 'primary');
    testElement.textContent = 'Test Dynamic';
    console.log('Dynamic Creation:');
    console.log('  - createElement:', '✅ Exitoso');
    
    // Intentar agregar al DOM temporalmente
    document.body.appendChild(testElement);
    setTimeout(() => {
      document.body.removeChild(testElement);
      console.log('  - DOM attachment:', '✅ Exitoso');
    }, 100);
    
  } catch (testError) {
    console.log('Dynamic Creation:');
    console.log('  - Error:', testError.message);
  }
  
  console.log('===============================');
  
  return !!nvButton;
}

// Auto-inicializar
if (typeof window !== 'undefined') {
  // Prevenir múltiples inicializaciones
  if (!window.__nativoComponentsInitialized) {
    window.__nativoComponentsInitialized = true;
    
    // Función global mejorada
    window.checkNativoComponents = checkRegistrationStatus;
    
    // Verificar Zone.js
    console.log('🌍 Zone.js disponible:', typeof Zone !== 'undefined');
    
    // Inicializar cuando esté listo
    const initWhenReady = () => {
      console.log('📍 DOM listo, iniciando componentes...');
      setTimeout(() => {
        initializeCustomElements().catch(error => {
          console.error('💥 Error fatal:', error);
          
          // Último intento
          setTimeout(() => {
            console.log('🔄 Último intento...');
            fallbackWithProviders().catch(finalError => {
              console.error('💀 Fallo total:', finalError);
            });
          }, 1000);
        });
      }, 100);
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
      initWhenReady();
    }
  }
}

// Exportar funciones
export { initializeCustomElements, fallbackWithProviders, checkRegistrationStatus };
`;

    const entryPath = path.join(buildPath, 'custom-elements-entry.js');
    await fs.writeFile(entryPath, entryContent);

    // Configuración de Rollup optimizada para incluir Zone.js
    const baseInputOptions = {
      input: entryPath,
      external: [], // Bundle todo incluyendo Zone.js
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          preventAssignment: true
        }),
        resolve({
          browser: true,
          preferBuiltins: false,
          exportConditions: ['es2020', 'es2015', 'module'],
          mainFields: ['browser', 'module', 'main']
        }),
        commonjs({
          include: /node_modules/,
          transformMixedEsModules: true
        })
      ],
      onwarn(warning, warn) {
        // Suprimir advertencias conocidas
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'EVAL') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    };

    // Output IIFE
    const iifeOutputOptions = {
      file: path.join(outputPath, 'nativo-components.js'),
      format: 'iife',
      name: 'NativoComponents',
      sourcemap: false
    };

    console.log('📦 Generando bundle con Zone.js...');
    const bundle = await rollup(baseInputOptions);
    await bundle.write(iifeOutputOptions);
    await bundle.close();

    // Versión minificada con configuración muy conservadora
    console.log('🗜️  Generando versión minificada...');
    const minifiedInputOptions = {
      ...baseInputOptions,
      plugins: [
        ...baseInputOptions.plugins,
        terser({
          ecma: 2020,
          compress: {
            drop_console: false, // Mantener logs para debug
            drop_debugger: true,
            keep_fargs: true,
            keep_fnames: true,
            keep_classnames: true,
            side_effects: false,
            unsafe: false,
            arrows: false,
            collapse_vars: false,
            reduce_vars: false,
            inline: false,
            passes: 1,
            dead_code: false,
            unused: false
          },
          mangle: {
            reserved: [
              'angular', 'ng', 'ɵ', 'NativoComponents', 'ButtonComponent',
              'initializeCustomElements', 'fallbackWithProviders', 
              'checkRegistrationStatus', 'checkNativoComponents',
              'NgZone', 'Zone', 'ApplicationRef'
            ],
            keep_fnames: true,
            keep_classnames: true
          },
          format: {
            comments: false
          }
        })
      ]
    };

    const minifiedBundle = await rollup(minifiedInputOptions);
    await minifiedBundle.write({
      ...iifeOutputOptions,
      file: path.join(outputPath, 'nativo-components.min.js')
    });
    await minifiedBundle.close();

    // Crear página de prueba final
    const finalTestPage = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nativo Components - Test Final</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 3px solid #667eea;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .status-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            transition: all 0.3s;
        }
        .status-card.success { 
            border-color: #28a745; 
            background: #d4edda;
        }
        .status-card.error { 
            border-color: #dc3545; 
            background: #f8d7da;
        }
        .status-card.warning { 
            border-color: #ffc107; 
            background: #fff3cd;
        }
        .status-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .status-label {
            color: #6c757d;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .test-section {
            margin: 2rem 0;
            padding: 1.5rem;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            background: #f8f9fa;
        }
        .test-section h3 {
            margin-top: 0;
            color: #495057;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .component-showcase {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        nv-button {
            margin: 0.25rem;
        }
        .log-panel {
            background: #1a1a1a;
            color: #00ff00;
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            max-height: 350px;
            overflow-y: auto;
            border: 2px solid #333;
        }
        .controls {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }
        .btn:hover { 
            background: #0056b3; 
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.4);
        }
        .btn.success { 
            background: #28a745; 
            box-shadow: 0 2px 4px rgba(40,167,69,0.3);
        }
        .btn.success:hover { 
            background: #1e7e34; 
            box-shadow: 0 4px 8px rgba(40,167,69,0.4);
        }
        .btn.danger { 
            background: #dc3545; 
            box-shadow: 0 2px 4px rgba(220,53,69,0.3);
        }
        .btn.danger:hover { 
            background: #c82333; 
            box-shadow: 0 4px 8px rgba(220,53,69,0.4);
        }
        .diagnostic-info {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
        }
        .diagnostic-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f8f9fa;
        }
        .diagnostic-row:last-child {
            border-bottom: none;
        }
        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .badge.success { background: #d4edda; color: #155724; }
        .badge.error { background: #f8d7da; color: #721c24; }
        .badge.warning { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Nativo Components - Test Final</h1>
            <p>Prueba completa con Zone.js y providers completos</p>
        </div>

        <div class="status-grid">
            <div class="status-card" id="status-init">
                <div class="status-value" id="init-value">⏳</div>
                <div class="status-label">Inicialización</div>
            </div>
            <div class="status-card" id="status-zone">
                <div class="status-value" id="zone-value">❓</div>
                <div class="status-label">Zone.js</div>
            </div>
            <div class="status-card" id="status-components">
                <div class="status-value" id="comp-value">0</div>
                <div class="status-label">Componentes</div>
            </div>
            <div class="status-card" id="status-errors">
                <div class="status-value" id="error-value">0</div>
                <div class="status-label">Errores</div>
            </div>
        </div>

        <div class="controls">
            <button class="btn" onclick="runFullDiagnostics()">🔬 Diagnósticos Completos</button>
            <button class="btn success" onclick="testDynamicCreation()">➕ Crear Dinámico</button>
            <button class="btn" onclick="stressTest()">⚡ Test de Estrés</button>
            <button class="btn danger" onclick="clearAllLogs()">🗑️ Limpiar</button>
        </div>

        <div class="test-section">
            <h3>🎯 Componentes de Prueba</h3>
            <div class="component-showcase">
                <nv-button type-button="primary">Primary</nv-button>
                <nv-button type-button="secondary">Secondary</nv-button>
                <nv-button type-button="tertiary">Tertiary</nv-button>
                <nv-button type-button="ghost">Ghost</nv-button>
                <nv-button type-button="primary" size-button="small">Small</nv-button>
                <nv-button type-button="primary" size-button="default">Default</nv-button>
                <nv-button type-button="primary" size-button="puffy">Puffy</nv-button>
                <nv-button type-button="secondary" disabled>Disabled</nv-button>
                <nv-button type-button="primary" width="hug">Hug Width</nv-button>
            </div>
        </div>

        <div class="test-section">
            <h3>📊 Información Diagnóstica</h3>
            <div class="diagnostic-info" id="diagnostic-panel">
                <div class="diagnostic-row">
                    <span>Estado del Sistema</span>
                    <span class="badge warning" id="system-status">Verificando...</span>
                </div>
                <div class="diagnostic-row">
                    <span>Zone.js Global</span>
                    <span class="badge warning" id="zone-global">Verificando...</span>
                </div>
                <div class="diagnostic-row">
                    <span>NgZone en Injector</span>
                    <span class="badge warning" id="ngzone-injector">Verificando...</span>
                </div>
                <div class="diagnostic-row">
                    <span>Custom Elements API</span>
                    <span class="badge warning" id="custom-elements-api">Verificando...</span>
                </div>
                <div class="diagnostic-row">
                    <span>nv-button registrado</span>
                    <span class="badge warning" id="nvbutton-registered">Verificando...</span>
                </div>
            </div>
        </div>

        <div class="test-section">
            <h3>📝 Log del Sistema</h3>
            <div class="log-panel" id="system-log">Inicializando logging avanzado...</div>
        </div>
    </div>

    <!-- Cargar componentes -->
    <script src="./nativo-components.min.js"></script>
    
    <script>
        // Variables globales
        let startTime = performance.now();
        let logContainer;
        let errorCount = 0;
        let componentCount = 0;

        // Inicialización
        document.addEventListener('DOMContentLoaded', () => {
            logContainer = document.getElementById('system-log');
            logMessage('🚀 Sistema de pruebas avanzado inicializado');
            logMessage('⏱️  Medición de rendimiento iniciada');
            
            // Verificar Zone.js inmediatamente
            checkZoneJS();
            
            // Actualizar estado cada 500ms
            const statusInterval = setInterval(() => {
                updateAllStatus();
                if (componentCount > 0) {
                    clearInterval(statusInterval);
                    logMessage('✅ Monitoreo completado, componentes detectados');
                }
            }, 500);
            
            // Timeout de seguridad
            setTimeout(() => {
                clearInterval(statusInterval);
                if (componentCount === 0) {
                    logMessage('❌ TIMEOUT: 20 segundos sin detección de componentes', 'error');
                    updateStatusCard('status-init', 'error', '❌');
                }
            }, 20000);
        });

        // Función de logging mejorada
        function logMessage(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
            const icon = icons[type] || 'ℹ️';
            const logEntry = \`[\${timestamp}] \${icon} \${message}\`;
            
            console.log(logEntry);
            if (logContainer) {
                logContainer.innerHTML += logEntry + '\\n';
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }

        // Verificar Zone.js
        function checkZoneJS() {
            const zoneAvailable = typeof Zone !== 'undefined';
            updateStatusCard('status-zone', zoneAvailable ? 'success' : 'error', zoneAvailable ? '✅' : '❌');
            updateDiagnosticBadge('zone-global', zoneAvailable, 'Zone.js Disponible');
            
            if (zoneAvailable) {
                logMessage('✅ Zone.js detectado correctamente', 'success');
                logMessage(\`📋 Zone current: \${Zone.current ? 'Activo' : 'Inactivo'}\`);
            } else {
                logMessage('❌ Zone.js NO detectado', 'error');
            }
        }

        // Actualizar todas las tarjetas de estado
        function updateStatusCard(cardId, type, value) {
            const card = document.getElementById(cardId);
            if (card) {
                card.className = 'status-card ' + type;
                const valueEl = card.querySelector('.status-value');
                if (valueEl) valueEl.textContent = value;
            }
        }

        // Actualizar badges diagnósticos
        function updateDiagnosticBadge(badgeId, isSuccess, successText, errorText) {
            const badge = document.getElementById(badgeId);
            if (badge) {
                badge.className = 'badge ' + (isSuccess ? 'success' : 'error');
                badge.textContent = isSuccess ? (successText || '✅ OK') : (errorText || '❌ Error');
            }
        }

        // Actualizar estado general
        function updateAllStatus() {
            // Verificar componentes
            const nvButton = customElements.get('nv-button');
            const newComponentCount = nvButton ? 1 : 0;
            
            if (newComponentCount !== componentCount) {
                componentCount = newComponentCount;
                updateStatusCard('status-components', componentCount > 0 ? 'success' : 'error', componentCount);
                updateDiagnosticBadge('nvbutton-registered', componentCount > 0);
                
                if (componentCount > 0) {
                    const loadTime = Math.round(performance.now() - startTime);
                    logMessage(\`🎉 Componentes cargados en \${loadTime}ms\`, 'success');
                    updateStatusCard('status-init', 'success', '✅');
                    updateDiagnosticBadge('system-status', true, 'Sistema OK');
                    setupEventListeners();
                }
            }
            
            // Verificar API Custom Elements
            updateDiagnosticBadge('custom-elements-api', typeof customElements !== 'undefined');
            
            // Verificar NgZone si está disponible
            if (window.NativoComponents && window.NativoComponents.injector) {
                try {
                    const hasNgZone = window.NativoComponents.ngZone || false;
                    updateDiagnosticBadge('ngzone-injector', hasNgZone, 'NgZone OK', 'NgZone Missing');
                } catch (e) {
                    updateDiagnosticBadge('ngzone-injector', false, 'NgZone OK', 'Error verificando NgZone');
                }
            }
        }

        // Configurar event listeners
        function setupEventListeners() {
            const buttons = document.querySelectorAll('nv-button');
            logMessage(\`🔗 Configurando eventos para \${buttons.length} botones\`);
            
            buttons.forEach((button, index) => {
                button.addEventListener('buttonClick', (event) => {
                    const type = button.getAttribute('type-button') || 'default';
                    const size = button.getAttribute('size-button') || 'default';
                    logMessage(\`🔘 Botón \${index + 1} (\${type}/\${size}) activado\`, 'info');
                });
            });
        }

        // Diagnósticos completos
        function runFullDiagnostics() {
            logMessage('🔬 Ejecutando diagnósticos completos...', 'info');
            
            // Verificar APIs
            logMessage(\`📱 Custom Elements API: \${typeof customElements !== 'undefined' ? '✅' : '❌'}\`);
            logMessage(\`🌍 Zone.js: \${typeof Zone !== 'undefined' ? '✅' : '❌'}\`);
            
            // Verificar componentes
            const nvButton = customElements.get('nv-button');
            logMessage(\`🔘 nv-button: \${nvButton ? '✅ Registrado' : '❌ No registrado'}\`);
            
            // Verificar instancias DOM
            const instances = document.querySelectorAll('nv-button');
            logMessage(\`📊 Instancias en DOM: \${instances.length}\`);
            
            // Verificar objeto global
            logMessage(\`🌐 window.NativoComponents: \${window.NativoComponents ? '✅' : '❌'}\`);
            
            if (window.NativoComponents) {
                logMessage(\`📋 Método usado: \${window.NativoComponents.method || 'no especificado'}\`);
                logMessage(\`🔧 NgZone disponible: \${window.NativoComponents.ngZone ? '✅' : '❌'}\`);
            }
            
            // Ejecutar verificación integrada si está disponible
            if (window.checkNativoComponents) {
                logMessage('🔧 Ejecutando verificación integrada...');
                window.checkNativoComponents();
            }
        }

        // Test de creación dinámica
        function testDynamicCreation() {
            logMessage('🧪 Probando creación dinámica...', 'info');
            
            try {
                const dynamicButton = document.createElement('nv-button');
                dynamicButton.setAttribute('type-button', 'primary');
                dynamicButton.setAttribute('size-button', 'small');
                dynamicButton.textContent = 'Dinámico Test';
                dynamicButton.style.margin = '0.5rem';
                
                dynamicButton.addEventListener('buttonClick', () => {
                    logMessage('🎉 ¡Botón dinámico funcionando!', 'success');
                });
                
                // Agregar al showcase
                const showcase = document.querySelector('.component-showcase');
                if (showcase) {
                    showcase.appendChild(dynamicButton);
                    logMessage('✅ Botón dinámico creado y agregado exitosamente', 'success');
                } else {
                    logMessage('❌ No se pudo encontrar el contenedor showcase', 'error');
                }
                
            } catch (error) {
                logMessage(\`❌ Error creando botón dinámico: \${error.message}\`, 'error');
            }
        }

        // Test de estrés
        function stressTest() {
            logMessage('⚡ Iniciando test de estrés...', 'info');
            
            const buttons = document.querySelectorAll('nv-button');
            let clickCount = 0;
            
            buttons.forEach((button, index) => {
                setTimeout(() => {
                    try {
                        button.dispatchEvent(new CustomEvent('buttonClick'));
                        clickCount++;
                        
                        if (clickCount === buttons.length) {
                            logMessage(\`✅ Test de estrés completado: \${clickCount} clicks procesados\`, 'success');
                        }
                    } catch (error) {
                        logMessage(\`❌ Error en botón \${index}: \${error.message}\`, 'error');
                    }
                }, index * 50);
            });
        }

        // Limpiar logs
        function clearAllLogs() {
            if (logContainer) {
                logContainer.innerHTML = 'Logs limpiados...\\n';
                logMessage('🗑️ Sistema de logs reiniciado');
            }
        }

        // Event listeners del sistema
        window.addEventListener('nativo-components-ready', (event) => {
            const detail = event.detail || {};
            logMessage('🎉 Evento nativo-components-ready recibido', 'success');
            logMessage(\`📋 Método: \${detail.method || 'no especificado'}\`);
            logMessage(\`🔧 NgZone: \${detail.ngZone ? '✅ Disponible' : '❌ No disponible'}\`);
            logMessage(\`📊 Componentes: \${detail.components ? detail.components.join(', ') : 'no especificados'}\`);
        });

        window.addEventListener('error', (event) => {
            errorCount++;
            updateStatusCard('status-errors', errorCount > 0 ? 'error' : 'success', errorCount);
            logMessage(\`💥 Error global: \${event.error?.message || event.message}\`, 'error');
        });

        // Información inicial
        logMessage('🌐 User Agent: ' + navigator.userAgent.split(' ').slice(-2).join(' '));
        logMessage('📱 Viewport: ' + window.innerWidth + 'x' + window.innerHeight);
        logMessage('🔧 JavaScript Engine: ' + (window.chrome ? 'V8' : window.mozInnerScreenX !== undefined ? 'SpiderMonkey' : 'Desconocido'));
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(outputPath, 'final-test.html'), finalTestPage);

    // Package.json y README
    const packageJson = {
      name: '@nativo/custom-elements',
      version: '1.0.0',
      description: 'Nativo Components with Zone.js and Full Angular Providers',
      main: 'nativo-components.js',
      browser: 'nativo-components.min.js',
      files: ['nativo-components.js', 'nativo-components.min.js', 'final-test.html', 'README.md']
    };

    await fs.writeJSON(path.join(outputPath, 'package.json'), packageJson, { spaces: 2 });

    const readme = `# Nativo Custom Elements - Final

## ✅ Incluye

- **Zone.js**: Completamente integrado
- **NgZone Provider**: Configurado automáticamente  
- **Compilador JIT**: Para máxima compatibilidad
- **Providers completos**: Todo lo necesario para Angular

## 🚀 Uso

\`\`\`html
<script src="nativo-components.min.js"></script>
<nv-button type-button="primary">Funcionando!</nv-button>
\`\`\`

## 🧪 Test

Abre \`final-test.html\` para verificación completa:
- Estado de Zone.js en tiempo real
- Verificación de NgZone
- Diagnósticos automáticos
- Tests de estrés

## ✅ Debería resolver

- ❌ ~~No provider for NgZone!~~
- ❌ ~~Angular requires Zone.js~~
- ❌ ~~Custom elements no se renderizan~~

¡Ahora todo debería funcionar perfectamente! 🎉
`;

    await fs.writeFile(path.join(outputPath, 'README.md'), readme);

    // Limpiar archivos temporales
    await fs.remove(entryPath);

    console.log('\n🎉 ¡Build FINAL completado!');
    console.log(`📂 Archivos en: ${outputPath}`);
    console.log('\n🎯 Archivos principales:');
    console.log('  - nativo-components.js (con Zone.js)');
    console.log('  - nativo-components.min.js (producción)');
    console.log('  - final-test.html (test definitivo)');
    console.log('\n✅ CAMBIOS CRÍTICOS:');
    console.log('  🔹 Zone.js incluido automáticamente');
    console.log('  🔹 NgZone provider configurado');
    console.log('  🔹 Compilador JIT integrado');
    console.log('  🔹 Providers completos de Angular');
    console.log('\n🧪 Para probar: abre final-test.html');
    console.log('💡 Debería mostrar "Zone.js: ✅" y "Componentes: 1"');

  } catch (error) {
    console.error('❌ Error durante el build final:', error);
    process.exit(1);
  }
}

buildCustomElements();