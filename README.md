# AlyraVoteTesting

AlyraVoteTesting est mon second TP rendu durant la formation de la session dev Satoshi d'Alyra.

Ce TP consiste à évaluer mes compétences dans la gestion des tests pour des contrats.

## Installation

```bash
npm install
```

## Usage

```bash
# lance blockchain local
ganache

# exécute les différents tests
truffle test
```

## Les différents tests

### Main Testing
Cette partie consiste à tester les différents cas possibles avec expect, expectRevert et expectEvent.

### Aucune Proposition Aucun Note
Cette partie consiste à tester le cas où nous n'avons aucun voter, proposition ou vote. La proposition gagnante sera celle par défaut 'GENESIS'.

### Egalité
Cette partie consiste à tester le cas d'égalité en sélectionnant la première proposition avec le plus de vote. Ainsi, en cas d'égalité, le contrat choisira la proposition qui a été suggérée en premier.
