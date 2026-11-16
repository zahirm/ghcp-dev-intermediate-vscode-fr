---
applyTo: "**/*.cs"
---
# Instructions spécifiques à C#

- Utiliser `record` ou `record struct` pour les objets valeur plutôt que des types anonymes ou des classes nues.
- Préférer des `ArgumentException` / `KeyNotFoundException` explicites plutôt que de renvoyer `null` ou des sentinelles.
- La monnaie est en centimes `int`. Jamais `double`/`float`.
- Journaliser avec `Microsoft.Extensions.Logging`, jamais `Console.WriteLine`.
- Toute méthode de plus de 30 lignes doit être décomposée.
- Activer et respecter les types référence nullables ; annoter explicitement la nullabilité.
