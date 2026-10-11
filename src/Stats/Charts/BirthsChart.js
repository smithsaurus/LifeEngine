const FossilRecord = require("../FossilRecord");
const ChartController = require("./ChartController");

class BirthsChart extends ChartController {
    constructor() {
        super("Births",
            "Births since last data point",
            "Parent difference: the number of cell positions where the two parents of a sexually produced organism differed (0 means identical parents). Mate tolerance: the most cell differences an organism accepts in a mate, averaged over all living organisms.");
        this.chart.options.axisY2 = {
            title: "Cells",
            minimum: 0,
        };
    }

    setData() {
        this.clear();
        this.data.push({
                type: "line",
                markerType: "none",
                color: 'black',
                showInLegend: true,
                name: "asexual",
                legendText: "Asexual births",
                dataPoints: []
            }
        );
        this.data.push({
                type: "line",
                markerType: "none",
                color: 'green',
                showInLegend: true,
                name: "sexual",
                legendText: "Sexual births",
                dataPoints: []
            }
        );
        this.data.push({
                type: "line",
                markerType: "none",
                color: 'orange',
                axisYType: "secondary",
                showInLegend: true,
                name: "diff",
                legendText: "Avg. parent difference",
                dataPoints: []
            }
        );
        this.data.push({
                type: "line",
                markerType: "none",
                color: 'purple',
                axisYType: "secondary",
                showInLegend: true,
                name: "tolerance",
                legendText: "Avg. mate tolerance",
                dataPoints: []
            }
        );
        this.addAllDataPoints();
    }

    addDataPoint(i) {
        var t = FossilRecord.tick_record[i];
        this.data[0].dataPoints.push({x:t, y:FossilRecord.asexual_birth_counts[i]});
        this.data[1].dataPoints.push({x:t, y:FossilRecord.sexual_birth_counts[i]});
        this.data[2].dataPoints.push({x:t, y:FossilRecord.av_parent_diffs[i]});
        this.data[3].dataPoints.push({x:t, y:FossilRecord.av_mate_tolerances[i]});
    }
}

module.exports = BirthsChart;
