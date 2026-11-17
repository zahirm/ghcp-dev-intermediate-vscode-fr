# Kit de démo GitHub Copilot Dev Intermediate — édition .NET 8

Un kit compact et autonome pour démontrer les capacités de GitHub Copilot pendant
la préparation au GH-300.

- Cible **.NET 8 (C#)** et adapté pour **Visual Studio Code** avec **GitHub Copilot** et le **C# Dev Kit**.
- Utilise le harnais **Copilot** de VS Code (sélecteur **Session Target**), les **skills** d'agent et un fichier `.mcp.json` portable.
- Les deux modules sources sont **volontairement imparfaits** — un bogue de décalage d'un cran, un
  numéro de carte journalisé, une injection SQL, aucune documentation et (presque) aucun test — afin que Copilot ait un vrai
  travail à accomplir lors des démos de correction, de tests, de revue, de refactorisation et de modernisation.

---

## 📁 Disposition de la solution

```
CopilotDemoKit.sln
├─ src/
│  ├─ ShoppingCart/        ShoppingCart/Cart.cs
│  ├─ InventoryLegacy/     InventoryLegacy/InventoryLegacy.cs
│  └─ DemoApp/             Program.cs — pilote qui exerce les deux modules
├─ tests/
│  └─ ShoppingCart.Tests/  volontairement minimal — le manque « aucun test » pour la démo des tests
├─ .github/
│  ├─ copilot-instructions.md
│  ├─ instructions/csharp.instructions.md
│  ├─ skills/{security-review,unit-tests}/SKILL.md
│  └─ workflows/workshop-site.yml  vérifie que docs/index.html est à jour
├─ docs/index.html         guide d'atelier publié par GitHub Pages (généré depuis ce README)
├─ tools/workshop-site/    générateur du guide d'atelier
├─ .vscode/{settings.json,extensions.json}
├─ .mcp.json               serveurs MCP partagés avec l'espace de travail
├─ admin/content-exclusion-example.yml
└─ global.json  (épingle le SDK .NET 8)
```

---

## ✅ Prérequis

- SDK .NET 8 (`dotnet --list-sdks` doit afficher un `8.0.x` ; `global.json` l'épingle).
- Visual Studio Code à jour, connecté à un compte GitHub disposant de Copilot.
- Extensions **GitHub Copilot Chat** et **C# Dev Kit** (VS Code les propose à l'ouverture du dossier via `.vscode/extensions.json`).
- Ouvrez le **dossier racine** du dépôt (`code .`) ; le C# Dev Kit charge `CopilotDemoKit.sln` dans la vue **Solution Explorer**.
- Pour la démo 8 : [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli) installé (`copilot --version`).

---

## 🛠️ Compiler et exécuter

```powershell
dotnet build
dotnet run --project src/DemoApp
dotnet test
```

> L'application de démo enveloppe `Checkout` dans un try/catch afin que le bogue de décalage d'un cran apparaîsse comme une
> exception capturée au lieu de faire planter la présentation. Les tests sont aussi visibles dans la vue **Testing** (Test Explorer) de VS Code.

---

## 📦 Fichiers de ce kit

| Chemin | Ce qu'il démontre |
| --- | --- |
| `src/ShoppingCart/Cart.cs` | Bogue de décalage d'un cran, numéro de carte journalisé, monnaie en `double`, aucun test — suggestions en ligne, chat en ligne, revue, tests |
| `src/InventoryLegacy/InventoryLegacy.cs` | Injection SQL, aucun type/documentation — modernisation, refactorisation, sécurité, documentation |
| `.github/copilot-instructions.md` | Instructions personnalisées à l'échelle du dépôt (aussi utilisées pour la revue de sélection) |
| `.github/instructions/csharp.instructions.md` | Instructions ciblées par chemin via `applyTo` |
| `.github/skills/*/SKILL.md` | Skills d'agent réutilisables, invoqués comme commandes slash (`/unit-tests`, `/security-review`) |
| `.vscode/settings.json` | Activation de Copilot par langage, Next Edit Suggestions, instructions de revue, sessions cloud |
| `.vscode/extensions.json` | Extensions recommandées (Copilot Chat, C# Dev Kit) |
| `.mcp.json` | Serveurs MCP de l'espace de travail (GitHub, Microsoft Learn) au format portable `mcpServers` |
| `admin/content-exclusion-example.yml` | Syntaxe d'exclusion de contenu |
| `tools/workshop-site/build.mjs` | Génère le guide d'atelier `docs/index.html` (GitHub Pages) à partir de ce README |

> [!NOTE]
> **Héritage :** les fichiers de prompt (`.github/prompts/*.prompt.md`) et `.vscode/mcp.json` (clé `servers`) ne fonctionnent
> qu'avec le harnais **Local** de VS Code, déprécié et retiré d'ici février 2027. Ce kit utilise leurs remplaçants :
> les **skills** (`.github/skills/`) et le fichier `.mcp.json` à la racine. La commande **Chat: Open Customizations** > **Migrations**
> convertit d'anciens fichiers de prompt en skills.

---

## 🌐 Guide d'atelier en ligne

Les participants suivent l'atelier sur une version web de ce README, publiée avec GitHub Pages :
<https://zahirm.github.io/ghcp-dev-intermediate-vscode-fr/>.

- **Publication :** **Settings** > **Pages** > **Build and deployment** > **Deploy from a branch**, branche `main`, dossier `/docs`.
- **Source de vérité :** ce README. Le fichier `docs/index.html` est généré ; ne le modifiez pas à la main.
- **Après toute modification du README**, régénérez la page (Node.js 18 ou plus récent, aucune dépendance à installer) et validez `docs/index.html` avec le README :

  ```powershell
  node tools/workshop-site/build.mjs
  ```

  Le workflow `.github/workflows/workshop-site.yml` échoue si la page n'est pas à jour.

---

## 🅰️ Partie A — Utiliser GitHub Copilot dans l'IDE

### 1️⃣ Démo 1 — Activer et cadrer Copilot (2 min)

- Cliquez sur l'**icône Copilot dans la barre d'état** (en bas à droite) : montrez l'activation globale des suggestions en ligne, l'activation pour le langage de l'éditeur actif, et le bouton **Snooze** (pause de 5 minutes).
- Ouvrez `.vscode/settings.json` et montrez le paramètre `github.copilot.enable` : Copilot est activé pour `*`, `csharp` et `markdown`, mais désactivé pour `plaintext` et `scminput`.
- Ouvrez un fichier `.txt` et montrez qu'aucune suggestion n'apparaît, puis revenez à un fichier `.cs`.

> **Point de discussion :** dans VS Code, l'activation se gère par langage via `github.copilot.enable` (paramètres utilisateur ou d'espace de travail) et le menu Copilot de la barre d'état. Le paramètre d'espace de travail est versionné avec le dépôt, donc partagé par toute l'équipe.

---

### 2️⃣ Démo 2 — Suggestions en ligne et Next Edit Suggestions (3 min)

- Dans `src/ShoppingCart/Cart.cs`, placez le curseur à la fin de la classe `ShoppingCartModule` (après `Cart.cs:58`, avant l'accolade fermante `}` sur `Cart.cs:59`) et tapez :

  ```csharp
  // Returns the cart total in integer cents, including tax
  public static int TotalWithTax(Cart cart, double taxRate)
  ```

- Acceptez avec `Tab` (ou rejetez avec `Échap`). Survolez la suggestion pour afficher la barre d'outils et parcourir les alternatives (`Alt+]` / `Alt+[`). Acceptez mot par mot avec `Ctrl+→` (`Cmd+→` sur macOS), ou ligne par ligne avec la commande **Accept Next Line Of Inline Suggestion** de la palette de commandes (`Ctrl+Shift+P`).
- Assurez-vous que Next Edit Suggestions est activé (`github.copilot.nextEditSuggestions.enabled` est à `true` dans `.vscode/settings.json`), puis renommez la variable `total` dans `Subtotal` (déclarée sur `Cart.cs:40`, utilisée sur `Cart.cs:43` et `Cart.cs:45`) en `runningTotal`. Une flèche apparaît dans la gouttière : appuyez sur `Tab` pour sauter à la modification suivante, puis de nouveau sur `Tab` pour l'accepter, afin que les trois références soient mises à jour ensemble.

> **Point de discussion :** les suggestions en texte fantôme, l'acceptation partielle et NES (conscient des modifications récentes) sont des fonctionnalités distinctes ; NES signale la prochaine modification prédite par une flèche dans la gouttière, et `Tab` permet d'y naviguer puis de l'accepter.

---

### 3️⃣ Démo 3 — Chat en ligne et vue Chat (4 min)

- Sélectionnez la méthode `Subtotal` (`Cart.cs:38-46`), appuyez sur `Ctrl+I` (`Cmd+I` sur macOS) pour ouvrir le **chat en ligne**, et demandez :

  > Pourquoi cela lève-t-il une erreur à la dernière itération ? Corrige-le en conservant la même signature.

  (Le décalage d'un cran est la borne de boucle `i <= cart.Items.Count` sur `Cart.cs:41`.) Acceptez ou rejetez la modification directement dans l'éditeur.

- Montrez les **actions intelligentes** : clic droit sur la sélection > **Explain**. Sur une ligne soulignée par une erreur du compilateur, l'ampoule (`Ctrl+.`) propose aussi **Fix**.
- Ouvrez ensuite la **vue Chat** (`Ctrl+Alt+I`), choisissez l'agent **Ask** dans le sélecteur d'agent, et exécutez, dans l'ordre :
  - `Explique ce que fait #Subtotal`
  - `#Checkout comporte un problème de sécurité : propose un correctif` (`Cart.cs:53-58`)
  - `#codebase où le pourcentage de remise est-il appliqué ?` (`ApplyDiscount` sur `Cart.cs:48-50`, appelé depuis `Checkout` sur `Cart.cs:55`)
  - `#Cart.cs résume l'API publique dans un tableau`
  - `/compact` pour résumer la conversation et libérer de la fenêtre de contexte

> **Point de discussion :** dans VS Code, les briques du chat sont les agents intégrés (**Ask**, **Agent**, **Plan** via `/plan`), les références `#` pour attacher fichiers, symboles, dossiers ou outils (`#Cart.cs`, `#Subtotal`, `#codebase`, `#fetch`), le bouton **Add Context** (`+`), et les commandes slash (`/plan`, `/compact`, `/fork`, plus les skills installés). Les anciens participants `@workspace` / `@vscode` sont remplacés par `#codebase` et des questions directes. Soulignez les limites : la fenêtre de contexte est bornée et les requêtes consomment des crédits selon le modèle choisi.

---

### 4️⃣ Démo 4 — Modifications multi-fichiers en mode Agent (4 min)

- Dans la vue Chat, sélectionnez **Copilot** dans **Session Target**, l'agent **Agent**, et **Manual permissions** dans le sélecteur de permissions. Ajoutez `src/ShoppingCart/Cart.cs` et `src/InventoryLegacy/InventoryLegacy.cs` comme contexte (bouton **Add Context** `+`, glisser-déposer, ou `#Cart.cs #InventoryLegacy.cs`).
- Demandez :

  > La monnaie doit être gérée en centimes entiers dans les deux fichiers. Mets à jour le code et tous les appelants,
  > et conserve inchangés les noms des méthodes publiques.

  La monnaie utilise actuellement `double` à : `Cart.cs:9` (`CartItem.Price`), `Cart.cs:16` (`Cart.Discount`), `Cart.cs:26-27` (`CheckoutResult.OrderId`/`Total`), et `InventoryLegacy.cs:52-54` (`price_with_tax`).

- Développez le **working set** au-dessus de la zone de saisie : ouvrez chaque fichier modifié pour voir son diff, utilisez **Keep** sur certains et **Undo** sur d'autres, puis survolez la requête et sélectionnez **Restore Checkpoint** pour tout annuler.

> **Point de discussion :** le mode Agent planifie le changement, modifie plusieurs fichiers et vérifie le résultat. Les modifications sont déjà enregistrées sur disque ; **Keep**/**Undo** et les points de contrôle (checkpoints) gardent le tout réversible. Les points de contrôle n'annulent pas les commandes de terminal.

---

### 5️⃣ Démo 5 — Mode agent de bout en bout (5 min)

- Commencez par planifier : `/plan Ajouter une suite de tests xUnit pour src/InventoryLegacy`, et passez le plan en revue.
- Puis, avec l'agent **Agent**, demandez :

  > Ajoute une suite de tests xUnit pour src/InventoryLegacy, crée la structure du projet de tests si nécessaire,
  > exécute `dotnet test`, et corrige tout ce qui échoue.

  Bonnes méthodes à cibler : `get_stock` (`InventoryLegacy.cs:13-21`), `adjust` (`InventoryLegacy.cs:23-33`), `reorder_report` (`InventoryLegacy.cs:35-50`), et `price_with_tax` (`InventoryLegacy.cs:52-54`).

- Laissez-le planifier, modifier les fichiers, et demander l'approbation du terminal. Montrez l'invite d'approbation d'outil (en **Manual permissions**), puis les nouveaux tests dans la vue **Testing**.
- Variante avec un skill : tapez `/unit-tests #Cart.cs` pour invoquer le skill `.github/skills/unit-tests/SKILL.md`.

> **Point de discussion :** le mode agent choisit ses propres fichiers et outils, itère sur les échecs, et
> demande avant d'exécuter des commandes selon le niveau de permission choisi (**Manual**, **Assisted**, …). Les instructions
> (`.github/copilot-instructions.md`, `*.instructions.md`) s'appliquent automatiquement ; les skills sont chargés à la demande.

---

### 6️⃣ Démo 6 — MCP en mode agent (3 min)

- Ouvrez `.mcp.json` à la racine du dépôt : il déclare le serveur MCP **GitHub** (`https://api.githubcopilot.com/mcp/`) et le serveur **Microsoft Learn** (`https://learn.microsoft.com/api/mcp`) sous la clé `mcpServers`. Aucun jeton n'est stocké dans le fichier : l'authentification GitHub se fait par OAuth au premier usage.
- Exécutez **Chat: Open Customizations** (`Ctrl+Shift+P`) > **MCP Servers** : montrez les deux serveurs de l'espace de travail, acceptez la demande de confiance, puis ouvrez l'onglet **Tools** pour voir les outils fournis par MCP et les activer ou désactiver.
- Dans la vue Chat (agent **Agent**), demandez :

  > À l'aide des outils GitHub, liste les problèmes ouverts de ce dépôt et rédige un plan de correction pour
  > le plus ancien.

  puis :

  > Utilise les outils Microsoft Learn pour trouver la documentation officielle de `SqliteParameter` et montre comment corriger l'injection SQL de `get_stock`. Ne modifie aucun fichier.

- Développez l'appel d'outil dans la conversation pour montrer quel serveur a répondu.

> **Point de discussion :** MCP étend le mode agent avec des systèmes externes via un protocole ouvert ; les serveurs sont configurés par espace de travail (`.mcp.json`) ou par utilisateur (**Copilot Global**, partagé avec Copilot CLI), les outils se gèrent dans l'onglet **Tools**, et les appels d'outils sont soumis à approbation. Ne versionnez jamais de jetons dans `.mcp.json`.

---

### 7️⃣ Démo 7 — Sessions d'agent, Agents window et délégation (3 min)

- Sélectionnez **Open in Agents** dans la barre de titre de VS Code (ou **Chat: Open Agents window**) pour ouvrir l'**Agents window**.
- Démarrez une **New Session**, choisissez l'environnement **Cloud** puis ce dépôt avec **Choose Repository...** (le paramètre `chat.agentHost.cloudSandbox.enabled` est activé dans `.vscode/settings.json`), et déléguez :

  > Corrige le bogue de décalage d'un cran dans Subtotal(), exécute `dotnet test`, et ouvre une pull request.

  Variante depuis la vue Chat : **Session Target** > **Cloud**. Variante sur github.com : ouvrez le panneau Agents (ou assignez un problème à Copilot).
- Pendant que la session cloud travaille, démarrez une seconde session locale avec **New Worktree** pour montrer deux tâches parallèles isolées. Montrez le journal de session, les modifications dans **Changes**, la branche créée et la PR brouillon.
- Mentionnez les sous-agents : demandez « utilise un sous-agent pour lister tous les appels à `Console.WriteLine` » ; la session délègue cette unité de travail afin que la fenêtre de contexte principale ne soit pas consommée par des tâches annexes.

> **Point de discussion :** les sessions cloud s'exécutent sur une infrastructure gérée, sans garder votre machine allumée ; vous vous y reconnectez depuis VS Code ou Copilot CLI et examinez la PR comme
> tout autre contributeur.

---

### 8️⃣ Démo 8 — Copilot CLI (5 min)

- Dans le terminal intégré de VS Code (`` Ctrl+` ``) à la racine du dépôt, démarrez une session interactive (ou ouvrez le profil de terminal **GitHub Copilot CLI**, ou exécutez **Chat: New Copilot CLI Session**) :

  ```
  copilot                       # session interactive
  ```

- Dans la session, explorez les commandes :
  - `/help`, `/model`, `/clear`, `/session`, `/exit`
  - `/skills` et `/mcp` : la CLI réutilise les skills (`.github/skills/`) et les instructions du dépôt, comme VS Code
- Puis essayez quelques demandes :
  - `explique ce que fait src/InventoryLegacy/InventoryLegacy.cs et liste ses risques`
  - `écris un script PowerShell qui sauvegarde chaque fichier .cs dans backups/ avec un horodatage, puis exécute-le`
  - `renomme src/ShoppingCart/Cart.cs en src/ShoppingCart/ShoppingCart.cs et mets à jour les références d'espace de noms`
- Ou exécutez de manière non interactive :

  ```
  copilot -p "génère un .gitignore pour un projet .NET et Node"
  ```

> **Point de discussion :** la CLI apporte Copilot au terminal pour ceux qui ne vivent pas dans un
> IDE et partage le même moteur (Copilot SDK) que le harnais Copilot de VS Code — elle peut expliquer des commandes, générer des scripts et agir sur des fichiers, et elle demande l'approbation
> avant de modifier quoi que ce soit.

---

## 🅱️ Partie B — Revue de code, collaboration et paramètres d'organisation

### 9️⃣ Démo 9 — Revue de code et normes de revue personnalisées (4 min)

- Dans `src/ShoppingCart/Cart.cs`, sélectionnez `Checkout` (`Cart.cs:53-58`) > clic droit > **Review** pour obtenir des commentaires de revue en ligne dans l'éditeur et dans le panneau **Comments**. Attendez-vous à un signalement sur le numéro de carte journalisé (`Cart.cs:56`). Appliquez ou ignorez chaque suggestion.
- Modifiez un fichier, puis dans la vue **Source Control** (`Ctrl+Shift+G`), survolez **Changes** et sélectionnez **Code Review - Unstaged Changes** pour examiner les modifications locales avant de valider. Générez ensuite le message de commit avec l'icône étincelle.
- Ouvrez `.github/copilot-instructions.md`, montrez la section Normes de revue, puis montrez dans `.vscode/settings.json` que `github.copilot.chat.reviewSelection.instructions` pointe vers ce fichier. Modifiez une consigne et relancez la revue pour démontrer qu'elle change les commentaires.
- Sur github.com, demandez une revue à Copilot sur une pull request (elle lit aussi `.github/copilot-instructions.md`).

> **Point de discussion :** les normes de revue sont pilotées par un fichier d'instructions versionné, de sorte que la sortie de revue est
> cohérente dans toute l'équipe, dans l'IDE comme sur github.com. Pour une revue de sécurité approfondie, invoquez le skill `/security-review #InventoryLegacy.cs`.

---

### 🔟 Démo 10 — Résumés de PR, Spaces et Spark (3 min)

- Sur une PR ouverte sur github.com, utilisez Copilot > Générer un résumé et montrez la présentation qu'il rédige. Dans VS Code, avec l'extension **GitHub Pull Requests**, l'icône étincelle à côté du titre génère le titre et la description d'une nouvelle PR.
- Ouvrez un Copilot Space, attachez ce dépôt plus le lien du guide d'étude, et posez une question qui nécessite les deux.
- Dans Spark, décrivez un petit tableau de bord d'inventaire et laissez-le construire et déployer l'application.

> **Point de discussion :** les Spaces sont un contexte organisé et partageable ; Spark va du prompt à l'application en cours d'exécution.
