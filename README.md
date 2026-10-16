This is the readme for my evolution simulator, The Life Engine. 

FOR FEATURE REQUESTS, USE THE DISCUSSIONS TAB. FOR BUG REPORTS, USE THE ISSUES TAB. :)

> **About this fork:** this version adds **sexual reproduction** to The Life Engine: a new Sex cell, mating between organisms, crossover of body plans, an evolvable *mate tolerance*, separate costs for asexual and sexual reproduction, and new statistics and charts for tracking how often organisms reproduce sexually. See [Sexual Reproduction (fork additions)](#sexual-reproduction-fork-additions) for details.

# The Life Engine
[Play here!](https://thelifeengine.net/)

The life engine is a cellular automaton designed to simulate the long term processes of biological evolution. It allows organisms to eat, reproduce, mutate, and adapt.
Unlike genetic algorithms, the life engine does not manually select the most "fit" organism for some given task, but rather allows true natural selection to 
run its course. Organisms that survive, successfully produce offspring, and out-compete their neighbors naturally propogate througout the environment.

This is the second version of the [original evolution simulator](https://github.com/MaxRobinsonTheGreat/EvolutionSimulator), which I started in high school.


# How to Run and Modify the Code
 - [Install node and npm](https://nodejs.org/en/download/)
 - Download or clone this repository
 - Open a terminal or powershell comand prompt, go to the repository and run `npm install`
 - Run `npm run build` (or `npm run build-watch` for a better developer experience)
   - If you get a `Can't resolve jquery` error message run `npm install --save jquery`
 - Open `dist/index.html` in your browser. The simulation should start running.

To load custom creations (found in `/dist/assets`), you must have a simple web server that serves all files in the dist directory. I do this with python:
 - [Install python](https://www.python.org/downloads/)
 - run `python -m http.server --directory dist` from the repository root
 - Open `http://localhost:8000/` in your browser

### Npm build commands
- Production mode (minified): `npm run build`
- Watch mode (dev mode that auto-builds when you save a file): `npm run build-watch`
- Dev mode (better error messages): `npm run build-dev` 


# How the Simulation Works
## The Environment
The environment is a simple grid system made up of cells, which at every tick have a certain type. The environment is populated by organisms, which are structures of multiple cells.

## Cells
A cell can be one of the following types.
### Independent Cells
Independent cells are not part of organisms. 
- Empty - Dark blue, inert.
- Food - Grayish-blue, provides nourishment for organisms.
- Wall - Gray, blocks organisms movement and reproduction.
### Organism Cells
Organism Cells are only found in organisms, and cannot exist on their own in the grid.
- Mouth - Orange, eats food in directly adjacent cells.
- Producer - Green, randomly generates food in directly adjacent empty cells.
- Mover - Light blue, allows the organism to move and rotate randomly.
- Killer - Red, harms organisms in directly adjacent cells (besides itself).
- Armor - Purple, negates the effects of killer cells.
- Eye - Light purple with a slit, allows the organism to see and move intelligently. See further description below.
- Sex - Mint green with a red square in the middle, lets the organism mate with other organisms that also have a sex cell. See [Sexual Reproduction](#sexual-reproduction-fork-additions) below.

## Organisms
Organisms are structures of cells that eat food, reproduce, and die.
When an organism dies, every cell in the grid that was occupied by a cell in its body will be changed to food.
Their lifespan is calculated by multiplying the number of cells they have by the hyperparameter `Lifespan Multiplier`. They will survive for that many ticks unless killed by another organism.
When touched by a killer cell, an organism will take damage. Once it has taken as much damage as it has cells in its body, it will die. If the hyperparameter `One touch kill` is on, an organism will immediatly die when touched by a killer cell.

## Reproduction
Once an organism has eaten as much food as it has cells in its body (multiplied by the `Asexual cost multiplier`, default 1), it will attempt to reproduce asexually. 
First, offspring is formed by cloning the current organism and possibly mutating it (see below).
The offspring birth location is then chosen a certain number of cells in a random direction (up, down, left, right). This number is calculated programmatically such that it is far enough away that it can't intersect with it's parent.
Additionally, a random value between 1 and 3 is added to the location to introduce a little variance.
Reproduction can fail if the offspring attempts to occupy non-empty cells, like other organisms and food. If reproduction fails, the food required to produce a child is wasted.

## Mutation
Offspring can mutate their anatomies in 3 different ways: change a cell, lose a cell, or add a cell. Changing a cell sets a random cell to a random type. Losing a cell removes a random cell. Note that this can result in organisms with "gaps" and cells disconnected from the rest of its body. I consider this a feature, not a bug.
To add a cell the organism first selects a cell it already has in its body, then grows a new cell with a random type in a location adjacent to the selected cell.

If an organism mutates, there is a 10% chance that mutation will alter the movement patterns of the organism (see below).

## Movement and Rotation
Organisms with mover cells (light blue) are permitted to move freely about the grid. Only a single mover cell is required and adding more doesn't do anything. By default, an organism selects a random direction and moves one cell per tick in that direction for a certain number of ticks. This number is called "Move range", and it can mutate over time.

Organims can also rotate around a central pivot cell. This cell can never be removed by mutation, though it can change type. Movers rotate randomly when they change direction, and their rotation is not necessarily the same as their movement direction, ie, they aren't always facing the direction they are moving. Offspring of all organisms (including static ones) rotate randomly during reproduction. This rotation can be toggled in the simulation controls.

## Eyes and Brains
Any organism can evolve eyes, but when an organism has both eyes and mover cells it is given a brain. The eye, unlike other cells, has a direction, which is denoted by the direction of the slit in the cell. It "looks" forward in this direction and "sees" the first non-empty cell within a certain range. It checks the type of the cell and informs the brain, which then decideds how to move. The brain can either ignore (keep moving in whatever direction), chase (move towards the observed cell), or retreat (move in the opposite direction of the observed cell). The brain maps different observed cell types to different actions. For instance, the brain will chase when it sees food and retreat when it sees a killer cell. These behaviors can mutate over time. Sex cells are one of the cell types the brain can react to, so organisms can evolve to chase or avoid potential mates.


# Sexual Reproduction (fork additions)
Organisms can still reproduce asexually exactly as described above. On top of that, any organism with at least one Sex cell can also mate with another organism that has a Sex cell.

## Starting a mating
Every tick, each Sex cell checks its directly adjacent cells. If it touches a cell belonging to another living organism that also has a Sex cell, the two try to mate. Only the organism that starts the mating needs to touch with its Sex cell; the partner can be touched on any cell. Each Sex cell can produce at most one mating per tick.

If `Sex cell contact required` is turned off, contact between *any* cells of two organisms that both have a Sex cell can start a mating (at most one mating per organism per tick).

A mating only happens if:
1. **The parents can afford it.** The cost is the starting organism's normal food requirement (one food per cell, plus the extra mover cost) times the `Sexual cost multiplier`. The cost is shared: the two parents' combined food must be greater than it. The starting parent pays as much as it can and the partner covers the rest.
2. **The parents accept each other.** Both parents must tolerate how different their bodies are (see Mate Tolerance below).

## Crossover
The *parent difference* is the number of cell positions where the two parents' bodies differ: a position where one parent has a cell and the other doesn't, or where both have a cell of a different type.

The child starts as a copy of the parent that started the mating. Then, for every position where the parents differ, there is a 25% chance (`crossoverProb` in [Hyperparameters.js](src/Hyperparameters.js)) that the child takes the partner's version: it gains or swaps in the partner's cell, or loses a cell the partner doesn't have. Two identical parents therefore produce an identical child.

Each of the other traits (move range, mutation rate, mate tolerance) and each brain decision is inherited from a randomly chosen parent. Sexually produced children don't go through the normal anatomy mutation step; their variation comes from crossover. If crossover changed the body at all, the child is recorded as a new species.

The child is placed next to the starting parent, trying all four directions (starting from a random one) until it fits. As with asexual reproduction, the food is spent even if the child can't be placed.

## Mate Tolerance
Mate tolerance is the most cell differences an organism will accept in a mate. It has two modes, set in the Evolution tab:
- **Global (default):** every organism uses the same `Global mate tolerance`. The default of `-1` means no limit: any two organisms with Sex cells can mate.
- **Evolved:** turn on `Use evolved mate tolerance`. Each organism then has its own mate tolerance (default 5), and both parents must accept their parent difference. Each child's mate tolerance randomly goes up or down by 1 (never below 0) at birth, so it can evolve over time. It can be viewed and edited per organism in the organism editor.

## New Controls
**Simulation tab**
- `Asexual cost multiplier` - asexual reproduction costs this many times the normal food requirement. Raise it to make sexual reproduction relatively cheaper.
- `Sexual cost multiplier` - mating costs this many times the normal food requirement, shared between the two parents.

**Evolution tab**
- `Use evolved mate tolerance` - switch between global and evolved mate tolerance.
- `Global mate tolerance` - the most cell differences any organism accepts in a mate (`-1` = no limit). Only shown when evolved mate tolerance is off.
- `Sex cell contact required` - when on (default), a mating needs a Sex cell to touch the partner; when off, any contact between two Sex-cell organisms works.

**Organism editor**
- The Sex cell can be placed like any other cell type.
- `Mate Tolerance` can be edited when evolved mate tolerance is on.
- The brain editor includes a reaction for seeing Sex cells.

**Other**
- The speed slider's maximum is raised (max fps 1000 instead of 300).
- The control panel is taller (380px) and its tabs scroll inside it, so the extra settings fit.

## New Statistics
The Statistics tab shows:
- **Births** - total asexual and sexual births and the percentage that were sexual.
- **Average Mate Tolerance** - averaged over living organisms with a Sex cell (only shown in evolved mode).
- **Average Parent Difference** - the average parent difference over all sexual births.

Two new charts are available:
- **Births** - asexual and sexual births since the last data point, with average parent difference and average mate tolerance on a second axis.
- **Sexual Reproduction** - the percentage of living organisms with a Sex cell, the percentage of births that were sexual, and the percentage of sexual births from identical parents ("inbred").

These records are saved with the world. Worlds saved before this fork load with zeros for the new records.

## New Community Creations
Added to the Community Creations lists in `dist/assets`:
- **Organisms:** Ball, Bob, DNA Trap, Tropical Fish
- **Worlds:** Survival of the Fittest, Computer Zoo, Bob Breeder, Huggers

## Where the Code Lives
- [src/Organism/Cell/BodyCells/SexCell.js](src/Organism/Cell/BodyCells/SexCell.js) - the Sex cell; starts matings.
- [src/Organism/Organism.js](src/Organism/Organism.js) - `tryMateAround`, `mate` (cost, tolerance check, crossover), `anatomyDiff`, `mutateMateTolerance`, and the shared `placeChild`.
- [src/Hyperparameters.js](src/Hyperparameters.js) - new settings: `sexCellContactOnly`, `useGlobalMateTolerance`, `globalMateTolerance`, `crossoverProb`, `asexualCostMultiplier`, `sexualCostMultiplier`.
- [src/Stats/FossilRecord.js](src/Stats/FossilRecord.js), [src/Stats/Charts/BirthsChart.js](src/Stats/Charts/BirthsChart.js), [src/Stats/Charts/SexualReproductionChart.js](src/Stats/Charts/SexualReproductionChart.js) - birth tracking and charts. 
