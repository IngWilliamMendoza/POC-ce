import { Injectable, Injector, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';

/**
 * Servicio para registrar componentes Angular como custom elements de forma dinámica
 */
@Injectable({
  providedIn: 'root'
})
export class CustomElementsRegistry {
  private registeredElements = new Set<string>();

  constructor(private injector: Injector) {}

  /**
   * Registra un componente Angular como custom element
   * @param tagName Nombre del tag HTML (debe contener un guión)
   * @param component Componente Angular a registrar
   * @returns true si se registró exitosamente, false si ya estaba registrado
   */
  register<T>(tagName: string, component: Type<T>): boolean {
    if (!this.isValidCustomElementName(tagName)) {
      throw new Error(`Invalid custom element name: ${tagName}. Must contain a hyphen.`);
    }

    if (this.isRegistered(tagName)) {
      console.warn(`Custom element ${tagName} is already registered`);
      return false;
    }

    try {
      const element = createCustomElement(component, { injector: this.injector });
      customElements.define(tagName, element);
      this.registeredElements.add(tagName);
      
      console.log(`Successfully registered custom element: ${tagName}`);
      return true;
    } catch (error) {
      console.error(`Failed to register custom element ${tagName}:`, error);
      throw error;
    }
  }

  /**
   * Registra múltiples componentes
   * @param elements Array de configuraciones {tagName, component}
   */
  registerMultiple<T>(elements: Array<{tagName: string, component: Type<T>}>): void {
    elements.forEach(({ tagName, component }) => {
      this.register(tagName, component);
    });
  }

  /**
   * Verifica si un custom element está registrado
   * @param tagName Nombre del tag a verificar
   */
  isRegistered(tagName: string): boolean {
    return this.registeredElements.has(tagName) || customElements.get(tagName) !== undefined;
  }

  /**
   * Obtiene la lista de elementos registrados
   */
  getRegisteredElements(): string[] {
    return Array.from(this.registeredElements);
  }

  /**
   * Valida que el nombre del custom element sea válido
   * Debe contener al menos un guión según la especificación
   */
  private isValidCustomElementName(name: string): boolean {
    return /^[a-z][\w-]*-[\w-]*$/.test(name);
  }

  /**
   * Espera hasta que un custom element esté definido
   * @param tagName Nombre del tag a esperar
   */
  async whenDefined(tagName: string): Promise<void> {
    if (!this.isRegistered(tagName)) {
      throw new Error(`Custom element ${tagName} is not registered`);
    }
    
    await customElements.whenDefined(tagName);
  }
}