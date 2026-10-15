const CellStates = require("./Cell/CellStates");
const Neighbors = require("../Grid/Neighbors");
const Hyperparams = require("../Hyperparameters");
const Directions = require("./Directions");
const Anatomy = require("./Anatomy");
const Brain = require("./Perception/Brain");
const FossilRecord = require("../Stats/FossilRecord");
const SerializeHelper = require("../Utils/SerializeHelper");

// directions the crossover line can be ordered along: horizontal, vertical and both diagonals, from either side
const SplitDirections = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];

class Organism {
    constructor(col, row, env, parent=null) {
        this.c = col;
        this.r = row;
        this.env = env;
        this.lifetime = 0;
        this.food_collected = 0;
        this.living = true;
        this.anatomy = new Anatomy(this)
        this.direction = Directions.down; // direction of movement
        this.rotation = Directions.up; // direction of rotation
        this.can_rotate = Hyperparams.rotationEnabled;
        this.move_count = 0;
        this.move_range = 4;
        this.ignore_brain_for = 0;
        this.mutability = 5;
        this.mate_tolerance = 5; // most cell differences it accepts in a mate
        this.crossover_split = 50; // percent of a sexual child's body taken from this organism when it initiates
        this.genetic_load = 0; // rises with clonal and inbred births, falls with outcrossing; shortens lifespan
        this.damage = 0;
        this.sexual = false; // born from a mating
        this.parent_diff = 0; // number of cell positions where its two parents differed
        this.brain = new Brain(this);
        if (parent != null) {
            this.inherit(parent);
        }
    }

    inherit(parent) {
        this.move_range = parent.move_range;
        this.mutability = parent.mutability;
        this.mate_tolerance = parent.mate_tolerance;
        this.crossover_split = parent.crossover_split;
        this.genetic_load = parent.genetic_load;
        this.species = parent.species;
        for (var c of parent.anatomy.cells){
            //deep copy parent cells
            this.anatomy.addInheritCell(c);
        }
        if(parent.anatomy.is_mover && parent.anatomy.has_eyes) {
            this.brain.copy(parent.brain);
        }
    }

    // amount of food required before it can reproduce
    foodNeeded() {
        return this.anatomy.is_mover ? this.anatomy.cells.length + Hyperparams.extraMoverFoodCost : this.anatomy.cells.length;
    }

    // amount of food required before it can reproduce on its own
    asexualFoodNeeded() {
        return this.foodNeeded() * Hyperparams.asexualCostMultiplier;
    }

    lifespan() {
        // genetic load shortens life: each point costs geneticLoadPenalty percent, with diminishing effect
        var load_factor = 1 + this.genetic_load * Hyperparams.geneticLoadPenalty / 100;
        return this.anatomy.cells.length * Hyperparams.lifespanMultiplier / load_factor;
    }

    maxHealth() {
        return this.anatomy.cells.length;
    }

    reproduce() {
        //produce mutated child
        //check nearby locations (is there room and a direct path)
        var org = new Organism(0, 0, this.env, this);
        if(Hyperparams.rotationEnabled){
            org.rotation = Directions.getRandomDirection();
        }
        var prob = this.mutability;
        if (Hyperparams.useGlobalMutability){
            prob = Hyperparams.globalMutability;
        }
        else {
            //mutate the mutability
            if (Math.random() <= 0.5)
                org.mutability++;
            else{ 
                org.mutability--;
                if (org.mutability < 1)
                    org.mutability = 1;
            }
        } 
        org.mutateMateTolerance();
        org.mutateCrossoverSplit();
        org.genetic_load++; // a clone carries one more point of load
        var mutated = false;
        if (Math.random() * 100 <= prob) {
            if (org.anatomy.is_mover && Math.random() * 100 <= 10) { 
                if (org.anatomy.has_eyes) {
                    org.brain.mutate();
                }
                org.move_range += Math.floor(Math.random() * 4) - 2;
                if (org.move_range <= 0){
                    org.move_range = 1;
                };
                
            }
            else {
                mutated = org.mutate();
            }
        }

        this.placeChild(org, mutated);
        Math.max(this.food_collected -= this.asexualFoodNeeded(), 0);
    }

    // tries to drop a child near this organism. new_species: the child's anatomy differs from this organism's
    placeChild(org, new_species, direction=Directions.getRandomScalar()) {
        var direction_c = direction[0];
        var direction_r = direction[1];
        var offset = (Math.floor(Math.random() * 3));
        var basemovement = Math.max(this.anatomy.birth_distance, org.anatomy.birth_distance);
        var new_c = this.c + (direction_c*basemovement) + (direction_c*offset);
        var new_r = this.r + (direction_r*basemovement) + (direction_r*offset);

        if (org.isClear(new_c, new_r, org.rotation, true) &&
            org.isStraightPath(new_c, new_r, this.c, this.r, this) &&
            this.env.canAddOrganism())
        {
            org.c = new_c;
            org.r = new_r;
            this.env.addOrganism(org);
            org.updateGrid();
            if (new_species) {
                FossilRecord.addSpecies(org, this.species);
            }
            else {
                org.species.addPop();
            }
            if (org.sexual) {
                this.env.sexual_births++;
                this.env.total_parent_diff += org.parent_diff;
            }
            else {
                this.env.asexual_births++;
            }
            return true;
        }
        return false;
    }

    // sexual reproduction, triggered when one of this organism's sex cells touches one of partner's.
    // returns true if a mating happened (food was spent), even if the child had no room to spawn
    mate(partner) {
        // the two parents only need the cost between them
        var cost = this.foodNeeded() * Hyperparams.sexualCostMultiplier;
        if (this.food_collected + partner.food_collected <= cost)
            return false;

        // both parents must tolerate how different the other's body is
        var diff = this.anatomyDiff(partner);
        if (Hyperparams.useGlobalMateTolerance) {
            if (Hyperparams.globalMateTolerance >= 0 && diff > Hyperparams.globalMateTolerance)
                return false;
        }
        else if (diff > this.mate_tolerance || diff > partner.mate_tolerance) {
            return false;
        }

        // child starts as a copy of this parent (the one whose sex cell initiated).
        // identical parents have nothing to cross over, so their child is a plain copy
        var org = new Organism(0, 0, this.env, this);
        if(Hyperparams.rotationEnabled){
            org.rotation = Directions.getRandomDirection();
        }

        // split crossover: a straight line cuts across both bodies, and the child takes this parent's cells
        // on one side and the partner's on the other. crossover_split sets where the line falls:
        // the percent of cell positions that come from this parent (50 cuts through the middle)
        var positions = [];
        for (var cell of this.anatomy.cells.concat(partner.anatomy.cells)) {
            if (!positions.some(p => p[0] == cell.loc_col && p[1] == cell.loc_row))
                positions.push([cell.loc_col, cell.loc_row]);
        }
        var dir = SplitDirections[Math.floor(Math.random() * SplitDirections.length)];
        positions.sort((a, b) => (a[0]*dir[0] + a[1]*dir[1]) - (b[0]*dir[0] + b[1]*dir[1]));
        var split = Hyperparams.useGlobalCrossoverSplit ? Hyperparams.globalCrossoverSplit : this.crossover_split;
        var from_this = Math.round(positions.length * split / 100);
        org.anatomy.clear();
        for (var i=0; i<positions.length; i++) {
            var source = i < from_this ? this : partner;
            var cell = source.anatomy.getLocalCell(positions[i][0], positions[i][1]);
            if (cell != null)
                org.anatomy.addInheritCell(cell);
        }
        // every organism needs a centre cell
        if (org.anatomy.getLocalCell(0, 0) == null) {
            var centre = this.anatomy.getLocalCell(0, 0) || partner.anatomy.getLocalCell(0, 0);
            if (centre != null)
                org.anatomy.addInheritCell(centre);
        }
        var changed = org.anatomyDiff(this) > 0;

        org.anatomy.checkTypeChange();
        org.sexual = true;
        org.parent_diff = diff;

        // identical parents add a point of load like cloning does; different parents remove
        // one point for every cell position they differ by
        var parent_load = Math.round((this.genetic_load + partner.genetic_load) / 2);
        org.genetic_load = diff == 0 ? parent_load + 1 : Math.max(parent_load - diff, 0);

        // behaviour: each trait and each brain decision comes from a random parent
        org.move_range = (Math.random() < 0.5 ? this : partner).move_range;
        org.mutability = (Math.random() < 0.5 ? this : partner).mutability;
        org.mate_tolerance = (Math.random() < 0.5 ? this : partner).mate_tolerance;
        org.crossover_split = (Math.random() < 0.5 ? this : partner).crossover_split;
        for (var dec in org.brain.decisions) {
            org.brain.decisions[dec] = (Math.random() < 0.5 ? this : partner).brain.decisions[dec];
        }
        org.mutateMateTolerance();
        org.mutateCrossoverSplit();

        // try every direction, starting from a random one, until the child fits
        var start = Directions.getRandomDirection();
        for (var i=0; i<4; i++) {
            if (this.placeChild(org, changed, Directions.scalars[(start+i) % 4]))
                break;
        }

        // this parent pays what it can, the partner covers the rest
        var paid = Math.min(this.food_collected, cost);
        this.food_collected -= paid;
        partner.food_collected -= cost - paid;
        return true;
    }


    // number of cell positions where this organism's body differs from partner's
    anatomyDiff(partner) {
        var diff = 0;
        for (var p_cell of partner.anatomy.cells) {
            var my_cell = this.anatomy.getLocalCell(p_cell.loc_col, p_cell.loc_row);
            if (my_cell == null || my_cell.state != p_cell.state)
                diff++;
        }
        for (var my_cell of this.anatomy.cells) {
            if (partner.anatomy.getLocalCell(my_cell.loc_col, my_cell.loc_row) == null)
                diff++;
        }
        return diff;
    }

    // drifts by one each birth, like mutability
    mutateMateTolerance() {
        if (Hyperparams.useGlobalMateTolerance)
            return;
        if (Math.random() <= 0.5)
            this.mate_tolerance++;
        else if (this.mate_tolerance > 0)
            this.mate_tolerance--;
    }

    // drifts by 5 percentage points each birth, staying within 0-100
    mutateCrossoverSplit() {
        if (Hyperparams.useGlobalCrossoverSplit)
            return;
        if (Math.random() <= 0.5)
            this.crossover_split = Math.min(this.crossover_split + 5, 100);
        else
            this.crossover_split = Math.max(this.crossover_split - 5, 0);
    }

    mutate() {
        let added = false;
        let changed = false;
        let removed = false;
        if (this.calcRandomChance(Hyperparams.addProb)) {
            let branch = this.anatomy.getRandomCell();
            let state = CellStates.getRandomLivingType();//branch.state;
            let growth_direction = Neighbors.all[Math.floor(Math.random() * Neighbors.all.length)]
            let c = branch.loc_col+growth_direction[0];
            let r = branch.loc_row+growth_direction[1];
            if (this.anatomy.canAddCellAt(c, r)){
                added = true;
                this.anatomy.addRandomizedCell(state, c, r);
            }
        }
        if (this.calcRandomChance(Hyperparams.changeProb)){
            let cell = this.anatomy.getRandomCell();
            let state = CellStates.getRandomLivingType();
            this.anatomy.replaceCell(state, cell.loc_col, cell.loc_row);
            changed = true;
        }
        if (this.calcRandomChance(Hyperparams.removeProb)){
            if(this.anatomy.cells.length > 1) {
                let cell = this.anatomy.getRandomCell();
                removed = this.anatomy.removeCell(cell.loc_col, cell.loc_row);
            }
        }
        return added || changed || removed;
    }

    calcRandomChance(prob) {
        return (Math.random() * 100) < prob;
    }

    attemptMove() {
        var direction = Directions.scalars[this.direction];
        var direction_c = direction[0];
        var direction_r = direction[1];
        var new_c = this.c + direction_c;
        var new_r = this.r + direction_r;
        if (this.isClear(new_c, new_r)) {
            for (var cell of this.anatomy.cells) {
                var real_c = this.c + cell.rotatedCol(this.rotation);
                var real_r = this.r + cell.rotatedRow(this.rotation);
                this.env.changeCell(real_c, real_r, CellStates.empty, null);
            }
            this.c = new_c;
            this.r = new_r;
            this.updateGrid();
            return true;
        }
        return false;
    }

    attemptRotate() {
        if(!this.can_rotate){
            this.direction = Directions.getRandomDirection();
            this.move_count = 0;
            return true;
        }
        var new_rotation = Directions.getRandomDirection();
        if(this.isClear(this.c, this.r, new_rotation)){
            for (var cell of this.anatomy.cells) {
                var real_c = this.c + cell.rotatedCol(this.rotation);
                var real_r = this.r + cell.rotatedRow(this.rotation);
                this.env.changeCell(real_c, real_r, CellStates.empty, null);
            }
            this.rotation = new_rotation;
            this.direction = Directions.getRandomDirection();
            this.updateGrid();
            this.move_count = 0;
            return true;
        }
        return false;
    }

    changeDirection(dir) {
        this.direction = dir;
        this.move_count = 0;
    }

    // assumes either c1==c2 or r1==r2, returns true if there is a clear path from point 1 to 2
    isStraightPath(c1, r1, c2, r2, parent){
        if (c1 == c2) {
            if (r1 > r2){
                var temp = r2;
                r2 = r1;
                r1 = temp;
            }
            for (var i=r1; i!=r2; i++) {
                var cell = this.env.grid_map.cellAt(c1, i)
                if (!this.isPassableCell(cell, parent)){
                    return false;
                }
            }
            return true;
        }
        else {
            if (c1 > c2){
                var temp = c2;
                c2 = c1;
                c1 = temp;
            }
            for (var i=c1; i!=c2; i++) {
                var cell = this.env.grid_map.cellAt(i, r1);
                if (!this.isPassableCell(cell, parent)){
                    return false;
                }
            }
            return true;
        }
    }

    isPassableCell(cell, parent){
        return cell != null && (cell.state == CellStates.empty || cell.owner == this || cell.owner == parent || cell.state == CellStates.food);
    }

    isClear(col, row, rotation=this.rotation) {
        for(var loccell of this.anatomy.cells) {
            var cell = this.getRealCell(loccell, col, row, rotation);
            if (cell==null) {
                return false;
            }
            if (cell.owner==this || cell.state==CellStates.empty || (!Hyperparams.foodBlocksReproduction && cell.state==CellStates.food)){
                continue;
            }
            return false;
        }
        return true;
    }

    harm() {
        this.damage++;
        if (this.damage >= this.maxHealth() || Hyperparams.instaKill) {
            this.die();
        }
    }

    die() {
        for (var cell of this.anatomy.cells) {
            var real_c = this.c + cell.rotatedCol(this.rotation);
            var real_r = this.r + cell.rotatedRow(this.rotation);
            this.env.changeCell(real_c, real_r, CellStates.food, null);
        }
        this.species.decreasePop();
        this.living = false;
    }

    updateGrid() {
        for (var cell of this.anatomy.cells) {
            var real_c = this.c + cell.rotatedCol(this.rotation);
            var real_r = this.r + cell.rotatedRow(this.rotation);
            this.env.changeCell(real_c, real_r, cell.state, cell);
        }
    }

    update() {
        this.lifetime++;
        if (this.lifetime > this.lifespan()) {
            this.die();
            return this.living;
        }
        if (this.food_collected >= this.asexualFoodNeeded()) {
            this.reproduce();
        }
        for (var cell of this.anatomy.cells) {
            cell.performFunction();
            if (!this.living)
                return this.living
        }
        
        if (this.anatomy.is_mover) {
            this.move_count++;
            var changed_dir = false;
            if (this.ignore_brain_for == 0){
                changed_dir = this.brain.decide();
            }  
            else{
                this.ignore_brain_for --;
            }
            var moved = this.attemptMove();
            if ((this.move_count > this.move_range && !changed_dir) || !moved){
                var rotated = this.attemptRotate();
                if (!rotated) {
                    this.changeDirection(Directions.getRandomDirection());
                    if (changed_dir)
                        this.ignore_brain_for = this.move_range + 1;
                }
            }
        }
        return this.living;
    }

    getRealCell(local_cell, c=this.c, r=this.r, rotation=this.rotation){
        var real_c = c + local_cell.rotatedCol(rotation);
        var real_r = r + local_cell.rotatedRow(rotation);
        return this.env.grid_map.cellAt(real_c, real_r);
    }

    isNatural() {
        let found_center = false;
        if (this.anatomy.cells.length === 0) {
            return false;
        }
        for (let i=0; i<this.anatomy.cells.length; i++) {
            let cell = this.anatomy.cells[i];
            for (let j=i+1; j<this.anatomy.cells.length; j++) {
                let toCompare = this.anatomy.cells[j];
                if (cell.loc_col === toCompare.loc_col && cell.loc_row === toCompare.loc_row) {
                    return false;
                }
            }
            if (cell.loc_col === 0 && cell.loc_row === 0) {
                found_center = true;
            }
        }
        return found_center;
    }

    serialize() {
        let org = SerializeHelper.copyNonObjects(this);
        org.anatomy = this.anatomy.serialize();
        if (this.anatomy.is_mover && this.anatomy.has_eyes)
            org.brain = this.brain.serialize();
        org.species_name = this.species.name;
        return org;
    }

    loadRaw(org) {
        SerializeHelper.overwriteNonObjects(org, this);
        this.anatomy.loadRaw(org.anatomy)
        if (org.brain)
            this.brain.copy(org.brain)
    }

}

module.exports = Organism;
