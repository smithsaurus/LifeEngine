const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");

class SexCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.sex, org, loc_col, loc_row);
        this.org.anatomy.has_sex = true;
    }

    performFunction() {
        // when contact anywhere is allowed, the organism checks all its cells itself (Organism.update) //claude ai
        if (!Hyperparams.sexCellContactOnly)
            return;
        this.org.tryMateAround(this); // one mating per sex cell per tick
    }
}

module.exports = SexCell;
