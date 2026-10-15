const PopulationChart = require("./Charts/PopulationChart");
const SpeciesChart = require("./Charts/SpeciesChart");
const MutationChart = require("./Charts/MutationChart");
const CellsChart = require("./Charts/CellsChart");
const BirthsChart = require("./Charts/BirthsChart");
const FossilRecord = require("./FossilRecord");


const ChartSelections = [PopulationChart, SpeciesChart, CellsChart, MutationChart, BirthsChart];

class StatsPanel {
    constructor(env) {
        this.defineControls();
        this.chart_selection = 0;
        this.setChart();
        this.env = env;
        this.last_reset_count=env.reset_count;
    }

    setChart(selection=this.chart_selection) {
        this.chart_controller = new ChartSelections[selection]();
        this.chart_controller.setData();
        this.chart_controller.render();
    }

    startAutoRender() {
        this.setChart();
        this.render_loop = setInterval(function(){this.updateChart();}.bind(this), 1000);
    }

    stopAutoRender() {
        clearInterval(this.render_loop);
    }

    defineControls() {
        $('#chart-option').change ( function() {
            this.chart_selection = $("#chart-option")[0].selectedIndex;
            this.setChart();
        }.bind(this));
    }

    updateChart() {
        if (this.last_reset_count < this.env.reset_count){
            this.reset()
        }
        this.last_reset_count = this.env.reset_count;
        this.chart_controller.updateData();
        this.chart_controller.render();
    }

    updateDetails() {
        var org_count = this.env.organisms.length;
        $('#org-count').text("Total Population: " + org_count);
        $('#species-count').text("Number of Species: " + FossilRecord.numExtantSpecies());
        let top_species = FossilRecord.getMostPopulousSpecies();
        if (top_species)
            $('#top-species').text("Most Populous Species: \"" + top_species.name + "\" (" + top_species.population + " organisms)");
        else    
            $('#top-species').text("Most Populous Species: None");
        $('#largest-org').text("Largest Organism Ever: " + this.env.largest_cell_count + " cells");
        $('#avg-mut').text("Average Mutation Rate: " + Math.round(this.env.averageMutability() * 100) / 100);
        var sexual = this.env.sexual_births;
        var births = sexual + this.env.asexual_births;
        $('#birth-counts').text("Births: " + this.env.asexual_births + " asexual, " + sexual + " sexual (" + (births > 0 ? Math.round(sexual / births * 100) : 0) + "% sexual)");
        $('#avg-mate-tolerance').text("Average Mate Tolerance: " + Math.round(this.env.averageMateTolerance() * 100) / 100 + " cells");
        $('#avg-crossover-split').text("Average Crossover Split: " + Math.round(this.env.averageCrossoverSplit() * 100) / 100 + "% from initiator");
        $('#avg-parent-diff').text("Average Parent Difference: " + (sexual > 0 ? Math.round(this.env.total_parent_diff / sexual * 100) / 100 : 0) + " cells");
    }

    reset() {
        this.setChart();
    }
    
}

module.exports = StatsPanel;