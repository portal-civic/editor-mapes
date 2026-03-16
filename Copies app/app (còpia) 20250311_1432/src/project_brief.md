# Project brief - Editor de mapes per a documents

## Objectiu
Crear una aplicació d’escriptori basada en tecnologia web per a elaborar mapes elegants destinats a documents com:
- agendes urbanes
- plans estratègics
- diagnòstics territorials
- mapes d’actuacions

L’aplicació ha de permetre crear mapes de forma senzilla, visual i reutilitzable.

## Enfocament general
El producte principal és un editor/generador de mapes per a documents.

Més avant, part de les dades creades podran reutilitzar-se per a mapes interactius, però l’objectiu principal actual és:
- crear mapes estàtics
- guardar projectes
- reutilitzar capes
- exportar a PNG i PDF

## Tipus d’ús
- Seleccionar un municipi
- Triar un mapa base
- Crear capes noves des de zero
- Dibuir punts, línies i polígons
- Importar capes GeoJSON
- Aplicar colors, contorns i transparències
- Configurar una llegenda
- Guardar el projecte
- Crear diversos mapes dins del mateix projecte
- Reobrir projectes guardats
- Exportar cada mapa a PNG o PDF

## Model conceptual
- 1 projecte = habitualment 1 municipi
- dins del projecte hi ha moltes capes
- dins del projecte hi ha molts mapes
- les capes contenen les dades geogràfiques
- cada mapa guarda la composició visual d’un conjunt de capes

## Estructura de carpetes prevista
- app/ -> codi de l’aplicació
- projects/ -> projectes guardats
- cada projecte tindrà:
  - project.json
  - data/layers/*.geojson
  - maps/*.json
  - exports/

## Estructura de projecte exemple
projects/alcoi/
- project.json
- data/layers/zones-diagnostic.geojson
- data/layers/punts-interes.geojson
- maps/diagnostic-centre.json
- maps/actuacions-prioritaries.json
- exports/

## Funcions mínimes de la v1
1. Pantalla principal d’editor
2. Barra superior
3. Panell esquerre de capes
4. Zona central de mapa
5. Panell dret de llegenda
6. Selector de mapa base
7. Botons de guardar projecte i exportar
8. Dibuix de punts, línies i polígons
9. Creació de capes noves
10. Càrrega i guardat de mapes del projecte

## Tecnologies previstes
- React + Vite
- Leaflet
- Leaflet.draw
- més avant: Tauri per a empaquetar com a app d’escriptori

## Criteris d’interfície
- aspecte net i professional
- pensat per a documents tècnics i institucionals
- prioritzar simplicitat
- panells clars
- pocs colors base
- mapa central gran
- llegenda clara i editable

## Estat actual
Ja existeix un projecte Vite + React inicial dins de `app/`.
S’ha netejat la plantilla base i ara es vol construir la interfície inicial de l’editor.