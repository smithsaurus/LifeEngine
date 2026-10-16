const FossilRecord = require("../FossilRecord"); //claude ai
const ChartController = require("./ChartController"); //claude ai

class SexualReproductionChart extends ChartController { //claude ai
    constructor() { //claude ai
        super("Sexual Reproduction", //claude ai
            "Percent", //claude ai
            "Sex cell carriers: share of living organisms with at least one sex cell. Sexual births: share of births since the last data point that came from mating. Inbred: share of those sexual births whose parents had identical bodies."); //claude ai
        this.chart.options.axisY.maximum = 100; //claude ai
    } //claude ai

    setData() { //claude ai
        this.clear(); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'black', //claude ai
                showInLegend: true, //claude ai
                name: "carriers", //claude ai
                legendText: "% of organisms with a sex cell", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'green', //claude ai
                showInLegend: true, //claude ai
                name: "sexual", //claude ai
                legendText: "% of births that were sexual", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'red', //claude ai
                showInLegend: true, //claude ai
                name: "inbred", //claude ai
                legendText: "% of sexual births from identical parents", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.addAllDataPoints(); //claude ai
    } //claude ai

    addDataPoint(i) { //claude ai
        var t = FossilRecord.tick_record[i]; //claude ai
        var sexual = FossilRecord.sexual_birth_counts[i]; //claude ai
        var births = FossilRecord.asexual_birth_counts[i] + sexual; //claude ai
        this.data[0].dataPoints.push({x:t, y:FossilRecord.sex_carrier_pcts[i]}); //claude ai
        this.data[1].dataPoints.push({x:t, y:births > 0 ? sexual / births * 100 : 0}); //claude ai
        this.data[2].dataPoints.push({x:t, y:sexual > 0 ? FossilRecord.inbred_birth_counts[i] / sexual * 100 : 0}); //claude ai
    } //claude ai
} //claude ai

module.exports = SexualReproductionChart; //claude ai
