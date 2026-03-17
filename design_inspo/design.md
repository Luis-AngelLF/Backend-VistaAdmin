ANTIGRAVITY – Electoral System Design Rules
1️⃣ Principio Supremo: Trust First Design

En un sistema de votación:

Confianza > Estética
Claridad > Creatividad
Seguridad percibida > Animaciones bonitas

Cada decisión visual debe responder:

¿Genera confianza?

¿Es inequívoco?

¿Reduce errores humanos?

2️⃣ Information Architecture (IA) – Escaneable en 3 segundos
Reglas obligatorias:

El usuario debe entender:

Qué está votando

Cuántos candidatos puede elegir

Cuántos ha seleccionado

Qué falta para terminar

El contador de selección debe ser:

Visible permanentemente

Numéricamente claro (ej: 5 / 7 seleccionados)

No ambiguo

La acción principal (Finalizar voto):

Debe estar aislada

No competir con otras acciones

Visualmente dominante pero no agresiva

3️⃣ Layout System – Grid Electoral Modular
Reglas:

Grid simétrico

Tamaño uniforme de tarjetas

Foto dominante (reconocimiento facial inmediato)

Nombre legible debajo

Espacio consistente entre cards

Evitar:

Asimetría

Desorden

Diferencias arbitrarias en tamaño

La consistencia transmite legitimidad.

4️⃣ Candidate Card Rules (Componente crítico)

Cada tarjeta debe tener:

Obligatorio:

Foto clara y recortada consistentemente

Nombre completo

Indicador de selección inequívoco

Botón o área clickeable grande

Estado visual obligatorio:
| Estado                             | Visual                |
| ---------------------------------- | --------------------- |
| Default                            | Neutral               |
| Hover                              | Sutil elevación       |
| Selected                           | Borde + check visible |
| Disabled (cuando límite alcanzado) | Desaturado            |

Nunca usar:

Solo color para indicar selección (accesibilidad)

Iconos ambiguos

5️⃣ Color System – Neutralidad Política

Colores deben:

Ser institucionales (azules, grises, neutros)

Evitar rojo/verde como significado político

Mantener contraste alto

Cumplir accesibilidad WCAG AA mínimo

Color no debe:

Favorecer visualmente a ningún candidato

Crear jerarquías implícitas

6️⃣ System States Obligatorios (Critical)

Un sistema electoral sin estados claros = pérdida de confianza.

Debe existir:

Loading

Skeletons

No parpadeos

Selection Limit Reached

Mensaje claro:

“You have selected the maximum number of candidates.”

Error State

Recuperable

Nunca culpar al usuario

Ejemplo:

“Connection lost. Your current selections are محفوظ.”

Success State

Confirmación clara

Resumen visible antes de envío final

7️⃣ Interaction & Error Prevention
7.1 Selección

Click una vez → selecciona

Click otra vez → deselecciona

Feedback inmediato (<100ms)

7.2 Confirmación Final

Regla obligatoria:

Antes de enviar voto:

Pantalla de revisión

Lista clara de candidatos seleccionados

Confirmación final explícita

Nunca:

Enviar automáticamente

Hacer confirmación ambigua

8️⃣ Anti-Error UX (Human Mistake Prevention)

Sistema debe prevenir:

Votar menos candidatos sin darse cuenta

Votar más del límite

Confundir selección activa con hover

Cerrar sin advertencia si hay cambios

Requerido:

Modal de advertencia si abandona sin finalizar

Indicador persistente de progreso

9️⃣ Typography Rules

Sans-serif institucional

Jerarquía clara:

Título grande

Región secundaria

Instrucciones legibles

Nada decorativo

Nada experimental

Confianza se transmite con sobriedad.

🔟 Accessibility & Inclusión

Obligatorio:

Navegación por teclado

Focus states visibles

ARIA roles correctos

No depender solo de color

Soporte para lectores de pantalla

Sistema electoral debe ser universal.

11️⃣ Trust Indicators

Agregar elementos que aumenten percepción de seguridad:

Logo institucional

Año visible

Región visible

Indicador de proceso paso a paso

Footer con entidad auditora

Transparencia visual = legitimidad.

12️⃣ Audit Criteria Específico Electoral (/audit-extension)

Además del audit normal:

Visual Score ≥ 9 si:

No hay ambigüedad en selección

IA clara en <3 segundos

Grid consistente

Functional Score ≥ 9 si:

Límite se respeta 100%

No se pierde selección

Confirmación obligatoria antes de envío

Trust Score ≥ 9 si:

No hay microinteracciones confusas

No hay retrasos sin feedback

Estados siempre visibles

13️⃣ Principio Final Electoral

Un sistema de votación no debe:

Impresionar

Ser creativo

Ser llamativo

Debe:

Ser claro

Ser predecible

Ser confiable

Ser imposible de malinterpretar