const FossilRecord = require("../FossilRecord"); //claude ai
const ChartController = require("./ChartController"); //claude ai

class BirthsChart extends ChartController { //claude ai
    constructor() { //claude ai
        super("Births", //claude ai
            "Births since last data point", //claude ai
            "Parent difference: the number of cell positions where the two parents of a sexually produced organism differed (0 means identical parents). Mate tolerance: the most cell differences an organism accepts in a mate, averaged over living organisms that have a sex cell."); //claude ai
        this.chart.options.axisY2 = { //claude ai
            title: "Cells", //claude ai
            minimum: 0, //claude ai
        }; //claude ai
    } //claude ai

    setData() { //claude ai
        this.clear(); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'black', //claude ai
                showInLegend: true, //claude ai
                name: "asexual", //claude ai
                legendText: "Asexual births", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'green', //claude ai
                showInLegend: true, //claude ai
                name: "sexual", //claude ai
                legendText: "Sexual births", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'orange', //claude ai
                axisYType: "secondary", //claude ai
                showInLegend: true, //claude ai
                name: "diff", //claude ai
                legendText: "Avg. parent difference", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.data.push({ //claude ai
                type: "line", //claude ai
                markerType: "none", //claude ai
                color: 'purple', //claude ai
                axisYType: "secondary", //claude ai
                showInLegend: true, //claude ai
                name: "tolerance", //claude ai
                legendText: "Avg. mate tolerance", //claude ai
                dataPoints: [] //claude ai
            } //claude ai
        ); //claude ai
        this.addAllDataPoints(); //claude ai
    } //claude ai

    addDataPoint(i) { //claude ai
        var t = FossilRecord.tick_record[i]; //claude ai
        this.data[0].dataPoints.push({x:t, y:FossilRecord.asexual_birth_counts[i]}); //claude ai
        this.data[1].dataPoints.push({x:t, y:FossilRecord.sexual_birth_counts[i]}); //claude ai
        this.data[2].dataPoints.push({x:t, y:FossilRecord.av_parent_diffs[i]}); //claude ai
        this.data[3].dataPoints.push({x:t, y:FossilRecord.av_mate_tolerances[i]}); //claude ai
    } //claude ai
} //claude ai

module.exports = BirthsChart; //claude ai
