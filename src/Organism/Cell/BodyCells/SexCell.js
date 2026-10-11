const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");

class SexCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.sex, org, loc_col, loc_row);
        this.org.anatomy.has_sex = true;
    }

    performFunction() {
        var env = this.org.env;
        var c = this.getRealCol();
        var r = this.getRealRow();
        for (var loc of Hyperparams.mateableNeighbors) {
            var cell = env.grid_map.cellAt(c+loc[0], r+loc[1]);
            if (this.mateWithNeighbor(cell))
                return; // one mating per sex cell per tick
        }
    }

    mateWithNeighbor(n_cell) {
        // mates when touching any cell of another organism that has a sex cell somewhere in its body
        if(n_cell == null || n_cell.owner == null || n_cell.owner == this.org || !n_cell.owner.living || !n_cell.owner.anatomy.has_sex)
            return false;
        return this.org.mate(n_cell.owner);
    }
}

module.exports = SexCell;
