---
name: unit-tests
description: Générer une suite xUnit complète pour le type sélectionné. À utiliser lorsqu'on demande d'écrire des tests unitaires pour un type C#.
disable-model-invocation: true
---
# Tests unitaires xUnit

Générez une suite de tests `xUnit` pour le type ouvert (ou le type passé en argument).

Respectez les normes du dépôt définies dans `.github/copilot-instructions.md`.

Structurez la sortie ainsi :
1. Une courte liste des comportements que vous avez identifiés, avant tout code.
2. Le fichier de test lui-même, enregistré sous `tests/`.
3. Un tableau des cas limites que vous avez délibérément couverts et de ceux que vous avez jugés hors périmètre.

Exigences :
- Un `[Fact]` par comportement, nommé `<Comportement>`.
- Paramétrer les valeurs limites avec `[Theory]`/`[InlineData]` plutôt que de copier-coller les cas.
- Inclure au moins un test qui vérifie le type et le message de l'exception (`Assert.Throws`).
- Ne pas modifier le type testé.
