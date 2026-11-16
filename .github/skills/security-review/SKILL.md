---
name: security-review
description: Revue axée sur la sécurité du fichier courant. À utiliser lorsqu'on demande d'examiner un fichier C# pour y trouver des défauts de sécurité.
disable-model-invocation: true
---
# Revue de sécurité

Examinez le fichier courant (ou le fichier passé en argument) à la recherche de défauts de sécurité uniquement.

Pour chaque constat, indiquez : la gravité (élevée/moyenne/faible), la ligne exacte, pourquoi c'est exploitable,
et un correctif concret. Classez les constats par gravité. Si vous ne trouvez rien à un niveau de gravité donné, dites-le
explicitement plutôt que d'inventer un constat. Terminez par le seul changement qui élimine le plus de risque.
