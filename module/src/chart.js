const Noodl = require('@noodl/noodl-sdk');
import Chart from 'chart.js/dist/Chart.bundle';

import {useCallback} from 'react';

//convert "heyHi" to "Hey Hi"
function camelCaseToCapitalized(str) {
	return str
		.replace(/([A-Z])/g, ' $1') //insert space
		.replace(/^./, function(str){ return str.toUpperCase(); }) //uppercase first letter
}

//reduces some of the Noodl boiler plate for setting up inputs
function generateInputs({options, group, namespace, defaults}) {

	const inputs = {};
	options.forEach(option => {
		const name = option.name ? option.name : option;
		const inputName = namespace ? (namespace+'.'+name) : name;
		inputs[inputName] = {
			group,
			displayName: option.displayName ? option.displayName : camelCaseToCapitalized(name),
			type: option.type ? option.type : typeof defaults[name],
			default: option.transformFrom ? option.transformFrom(defaults[name]) : defaults[name]
		};
	});
	return inputs;
}

//generates an inputs changed function that change a chart.js option
function generateInputsChanged({options, namespace}) {
	const changed = {};
	options.forEach(option => {
		const name = option.name ? option.name : option;
		const inputName = namespace ? (namespace+'.'+name) : name;

		changed[inputName] = function(value) {
			if(!this.chart) return;

			let options = this.chart.options;
			if(namespace) {
				namespace.split('.').forEach(n => options = options[n]);
			}

			options[name] = option.transformTo ? option.transformTo(value) : value;
			this.chart.update();
		}
	});
	return changed;
}

function generateEnum(array) {
	return {
		name: 'enum',
		enums: array.map(v => {return {label: camelCaseToCapitalized(v), value: v}})
	}
}

function toNoodlFontClass(family) {
	if(family && family.split('.').length > 1) {
		family = family.replace(/\.[^/.]+$/, "");
		family = family.split('/').pop();
	}
	return family;
}

//options that are shared between all chart.js types
const globalOptions = {
	defaults: Chart.defaults.global,
	group: "General Options",
	options: ['responsive']
};

const tooltipsOptions = {
	defaults: Chart.defaults.global.tooltips,
	group: "Tooltips",
	namespace: "tooltips",
	options: [
		'enabled',
		'intersect',
		{name: 'mode', type: generateEnum(['point', 'nearest', 'index', 'dataset', 'x', 'y'])},
		{name: 'position', type: generateEnum(['average', 'nearest'])},
		{name: 'backgroundColor', type: 'color'},
		{name: 'bodyFontFamily', displayName: 'Font Family', type: 'font', transformTo: toNoodlFontClass},
		{name: 'bodyFontSize', displayName: 'Font Size'},
		{name: 'bodyFontColor', type: 'color'},
		{name: 'bodySpacing', displayName: 'Spacing'},
		'cornerRadius',
		'displayColors'
	]
};

const legendOptions = {
	defaults: Chart.defaults.global.legend,
	group: "Legend",
	namespace: "legend",
	options: [
		{name: 'display', displayName: 'Show Legend'},
		{name: 'position', type: generateEnum(['top', 'left', 'bottom' ,'right'])},
		{name: 'align', type: generateEnum(['start', 'center', 'end'])}
	]
};

const legendLabelsOptions = {
	defaults: Chart.defaults.global.legend.labels,
	group: "Legend",
	namespace: "legend.labels",
	options: [
		'boxWidth',
		'fontSize',
		{name: 'fontColor', type: 'color'},
		{name: 'fontFamily', type: 'font', transformTo: toNoodlFontClass},
		'padding'
	]
};

//a simple canvas to render the chart.js chart to
function Canvas(props) {
	const ref = useCallback(node => {
		props.onCanvasChanged(node);
	});

	return <canvas ref={ref}/>
}

//generate a Noodl node definition.
//All chart.js types have a very similar API and this function takes care
//of all the commonalities
export default function generateChartNoodlNode(args) {
	return Noodl.defineReactNode({
		name: args.name,
		category: 'chart.js',
		initialize() {
			this.props.onCanvasChanged = node => {
				if(this.chart) {
					this.chart.destroy();
				}
				if(node) {
					this.initChart(node);
				}
			};
		},
		getReactComponent() {
			return Canvas;
		},
		inputs: {
			datasets: {type: 'stringlist'},
			...generateInputs(args.options),
			...generateInputs(globalOptions),
			...generateInputs(tooltipsOptions),
			...generateInputs(legendOptions),
			...generateInputs(legendLabelsOptions),
			data: {
				type: '*',
				displayName: 'Data'
			},
			scales: {
				type: '*',
				displayName: 'Scales'
			}
		},
		changed: {
			...generateInputsChanged(args.options),
			...generateInputsChanged(globalOptions),
			...generateInputsChanged(tooltipsOptions),
			...generateInputsChanged(legendOptions),
			...generateInputsChanged(legendLabelsOptions),
            data(value) {
                if(!this.chart) return;
                this.chart.data = value;
                this.chart.update();
			},
			scales(value) {
                if(!this.chart) return;
                this.chart.options.scales = value;
                this.chart.update();
            }
		},
		methods: {
			setOptions(target, {options,namespace}) {

				(namespace || '').split('.').forEach(p => {
					if(!target[p]) target[p] = {};
					target = target[p];
				});

				options.forEach(option => {
					const name = option.name || option;
					const inputName = namespace ? (namespace+'.'+name) : name;
					if(this.inputs.hasOwnProperty(inputName)) {
						target[name] = option.transformTo ? option.transformTo(this.inputs[inputName]) : this.inputs[inputName];
					}
				});
			},
			initChart(canvas) {
	
				const options = {
					title: {
						display: false //disable title, it's more flexible to use Noodl for that
					}
				};

				this.setOptions(options, args.options);
				this.setOptions(options, globalOptions);
				this.setOptions(options, tooltipsOptions);
				this.setOptions(options, legendOptions);
				this.setOptions(options, legendLabelsOptions);

				options.scales = this.inputs.scales;

				this.chart = new Chart(canvas, {
					type: args.type,
					options,
					data: this.inputs.data || args.defaultData
				});
			}
		},
	})
}

//TODO: figure out if axes should be abstracted as nodes or kept purely in code
// const axis = [
// 	'display',
// 	'offset'
// ];

// const axisLabel = [
// 	'display',
// 	'labelString',
// 	'lineHeight',
// 	{name: 'fontColor', type: 'color'},
// 	{name: 'fontFamily', type: 'font', transformTo: toNoodlFontClass},
// 	'fontSize',
// 	'padding'
// ];
// const xAxisOptions = {
// 	defaults: Chart.defaults.scale,
// 	group: "X Axis",
// 	namespace: "scales.xaxes",
// 	setArray: 0,
// 	options: axis
// };

// const yAxisOptions = {
// 	defaults: Chart.defaults.scale,
// 	group: "Y Axis",
// 	namespace: "scales.yaxes",
// 	setArray: 0,
// 	options: axis
// };

// const xAxisLabelOption = {
// 	defaults: Chart.defaults.scale.scaleLabel,
// 	group: "X Axis Label",
// 	namespace: "scales.xaxes.scaleLabel",
// 	setArray: 0,
// 	options: axisLabel
// };

// const yAxisLabelOption = {
// 	defaults: Chart.defaults.scale.scaleLabel,
// 	group: "Y Axis Label",
// 	namespace: "yaxis.scaleLabel",
// 	options: axisLabel
// };