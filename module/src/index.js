const Noodl = require('@noodl/noodl-sdk');
import generateChartNoodlNode from './chart';

function degToRad(degrees) {
	return degrees / 180 * Math.PI;
}

function radToDeg(radians) {
	return radians / Math.PI * 180;
}

const PieChartNode = generateChartNoodlNode({
	name: 'Pie Chart',
	options: {
		defaults: Chart.defaults.pie,
		group: "Pie Options",
		options: [
			'cutoutPercentage', 
			{name: 'circumference', transformTo: degToRad, transformFrom: radToDeg},
			{name: 'rotation', transformTo: degToRad, transformFrom: radToDeg},
		]
	},
	type: 'pie',
	defaultData: {
		datasets: [{
			data: [10, 20, 30],
			backgroundColor: [
				'#FF5382',
				'#FFCC34',
				'#00A3F1'
			],
		}],
		labels: [
			'Red',
			'Yellow',
			'Blue'
		]
	}
});

const LineChartNode = generateChartNoodlNode({
	name: 'Line Chart',
	options: {
		options: []
	},
	type: 'line',
	defaultData: {
		labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
		datasets: [{
			label: 'My Data',
			data: [0,1,5,7,8,3,2],
			borderColor: '#00A3F1',
			fill: false
		}]
	}
});

Noodl.defineModule({
    reactNodes: [
		PieChartNode,
		LineChartNode
    ],
    nodes:[
    ],
    setup() {
    	//this is called once on startup
    }
});