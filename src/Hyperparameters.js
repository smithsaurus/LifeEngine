const Neighbors = require("./Grid/Neighbors");

const Hyperparams = {
    setDefaults: function() {
        this.lifespanMultiplier = 100;
        this.foodProdProb = 5;
        this.killableNeighbors = Neighbors.adjacent;
        this.edibleNeighbors = Neighbors.adjacent;
        this.growableNeighbors = Neighbors.adjacent;
        this.mateableNeighbors = Neighbors.adjacent;

        this.useGlobalMutability = false;
        this.globalMutability = 5;
        this.addProb = 33;
        this.changeProb = 33;
        this.removeProb = 33;
        
        this.rotationEnabled = true;

        this.foodBlocksReproduction = true;
        this.moversCanProduce = false;

        this.instaKill = false;

        this.lookRange = 20;
        this.seeThroughSelf = false;

        this.foodDropProb = 0;

        this.extraMoverFoodCost = 0;

        this.sexCellContactOnly = true; // mating needs a sex cell to touch the partner; when off, any contact between two [sex-bearing organisms] works // this might be broken
        // mate tolerance: the most cell differences accepted in a mate
        this.useGlobalMateTolerance = true;
        this.globalMateTolerance = -1; //(-1 means any partner works) //boots
        this.crossoverProb = 25; // chance a sexual child takes each of thepartner's cell differences
        // reproduction = multiplir * food needed
        this.asexualCostMultiplier = 1;
        this.sexualCostMultiplier = 1;

        this.maxOrganisms = -1;
    },

    loadJsonObj(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }
}

Hyperparams.setDefaults();

module.exports = Hyperparams;