/**------------------------------------------
 * This is an example of a Angular controller 
 * that handles basic CRUD operation
-------------------------------------------*/
(function() {
'use strict';

/*Declaring controller*/
angular
	.module('core')
	.controller('ProjectionController', ProjectionController);

/*Injecting dependencies*/
ProjectionController.$inject = ['$scope', 'projectionService', '$sce'];

/*Defining controller body*/
function ProjectionController($scope, projectionService, $sce) {

	var vm = this;	
	vm.data = [];
	vm.projection_levels = ["very poor", "poor", "expected", "good"];
	vm.chances = {
		vPoor:0,
		poor:0,
		expected:0,
		good:0
	}; 

	/* a watcher that watches for a change in variable and 
	perform an operation accordingly */
    $scope.$watch('investment', function(newval, oldval) {
			
		renderProjections($scope.investment.risk_level);
		initContent($scope.investment.risk_level);
	}, true);
 
	$(window).resize(function(){

		renderProjections($scope.investment.risk_level);
		initContent($scope.investment.risk_level);
	});

	/*function that initialises the content to some default values*/
	function initContent (risk_level) { 

		projectionService.getContent(risk_level).then(function(res){
			if(res){
				vm.content = $sce.trustAsHtml(res.description);
			} else{
				vm.content = $sce.trustAsHtml("");
			}
		},function (err){
			toastr.error('Error loading content, please refresh');
		});
	}

	/** 
	* Rendering the projections by getting data from backend
	* formatting data according the needs and displaying that to 
	* user.
	* 
	*/
	function renderProjections(risk_level){

		projectionService.getChartData(risk_level).then(function(res){

			if(res.length){
				$('.chart-outer').show();
				createHighChart(res);
			} else{
				$('.chart-outer').hide();
			}
			vm.data = res;
			var series = calculateSeries($scope.investment.initial_contribution, $scope.investment.horizon, res);
			if(series.length){
				$('#linechart').show();
				renderChart(series);
			} else{
				$('#linechart').hide();
			}
		},function (err){
			toastr.error('Error loading content, please refresh');
		});
	}
	
	/*filling data in to chart series to show them on the view*/
	function fillSeriesData (projection_level, amt, horizon, data, monthly_contribution){

		if(horizon<4){
			return fillSeriesDataQuarterly(projection_level, amt, horizon, data, monthly_contribution);
		}
		var row = getRowByProjectionLevel(data, projection_level);
		var t = [];
		for (var i = 0; i <= parseInt(horizon)+1; i++) {
			var a = [];
			a.push(parseInt(moment(getTimestampToday()).add(i,'years').format('x')));
			a.push(parseFloat(amt));
			t.push(a);
			amt = getAmtWithInterestAdded(parseFloat(amt)+(parseFloat(monthly_contribution)*12), row.interest_rate);
		}
		return t;
	}

	/* Simple maths calculation subfunction */
	function getAmtWithInterestAdded(amt, interest_rate){
		return Math.round(parseFloat(amt) + parseFloat(((parseFloat(amt)*parseFloat(interest_rate))/100)));
	}
	function getRowByProjectionLevel(arr, level){

		var tmp = null;
		angular.forEach(arr, function (v, i){

			if(v.projection_level==level){

				tmp = v;
			}
		});
		return tmp;
	}

	/**
	 * creating a chart that projects the values
	 * @param  {[Object]} projection_levels_data
	 * @return {[render]} renders the chart
	 * 
	 */
	function createHighChart(projection_levels_data){
	
		fillChances(projection_levels_data);
		var chartData = getChartData(projection_levels_data);
		console.log(chartData);
		$(function () {
		    $('#linehighchart').highcharts({
		        chart: {
		          	type: 'area',
		          	alignTicks: false,
		          	height: 350,
		          	backgroundColor: '#fbfbfb',
    				marginRight: 70,
    				marginTop: 20,
		          	spacing: [0, 0, 0, 0]
		        },
 				exporting: {enabled: false} ,
				credits: {enabled: false},
		        legend:{enabled: false},
		        title: { text: ''},
		        xAxis: {
		            type:'datetime',
		          	maxPadding: 0,
		            lineColor:'#bcbcbc',
			        title: {
			            text: 'Timeframe'
			        },
					plotLines: [
						{
						    color: '#6E8141',
						    dashStyle: 'LongDash',
						    value: moment().add($scope.investment.horizon, 'years'),
						    width: 1,
						    zIndex:6,
					        label: {
					          text: "<strong>" + moment().add($scope.investment.horizon,'years').format('MMMM, YYYY') + "</strong> <br /> Target Date",
					          style: {
					            fontWeight: 'normal',
					            color: '#6E8141',
					            textShadow: '1px 1px 1px #fff'
					          }
					        }
						}
					],
					plotBands: [{
					    color: 'rgba(244,244,244,0.5)',
					    zIndex:5,
					    fillOpacity:0.5,
					    from: moment().add($scope.investment.horizon, 'years'),
					    to: moment().add(parseInt($scope.investment.horizon)+1, 'years')
					}],
		        },
		        yAxis: {
		            title: {
		                text: 'Projected Value'
		            },
		            lineColor:'#bcbcbc',
		          	gridLineWidth: 0,
		            lineWidth: 1,
		          	opposite: true,
		          	labels: {
			            formatter: function() {
			              return '$' + this.value / 1000 + 'k';
			            }
			        },
		          	max: $scope.investment.target_amt>chartData.series.good[chartData.series.good.length-1][1]?$scope.investment.target_amt:chartData.series.good[chartData.series.good.length-1][1],
					plotLines: [
						{
						    color: '#6E8141',
						    dashStyle: 'LongDash',
						    value: $scope.investment.target_amt,
						    width: 1,
						    zIndex:6,
					        label: {
					          text: "<strong> $" + Highcharts.numberFormat($scope.investment.target_amt,'','',',') + "</strong> <br /> Target Value",
					          style: {
					            fontWeight: 'bold',
					            color: '#6E8141',
					            textShadow: '1px 1px 1px #fff'
					          }
					        }
						}
					],
		        },
		        tooltip: {
		          	crosshairs: [
			            {
			              zIndex: 9999,
			              zIndex: 9999
			            }
		          	],
			        shared: true,
    				formatter: function() {
						var s = [];
            			s.push('<strong>' + Highcharts.dateFormat('%B, %Y', this.points[0].x) + '</strong><br>');
			            $.each(this.points, function(i, point) {
			                s.push(
			                	'<span style="color:'+point.color+';font-weight:bold;">'+ point.series.name +' : $'
			                	+ Highcharts.numberFormat(point.y ,'','',',')
			                    +'<span><br>'
		                    );
			            });
			            return s.join('');
		          	}
		        },
		        plotOptions: {
		          	area: {
			            zIndex: 60,
			            lineWidth: 0,
			            marker: {
			              	enabled: false,
			              	fillOpacity: 1,
			              	symbol: 'circle',
			              	radius: 4,
	              			fillColor: '#FFF'
			            }
		          	},
			        scatter: {
			            zIndex: 60,
			            enableMouseTracking: false,
			            marker: {
			              	symbol: 'circle',
			              	radius: 20,
			              	lineWidth: 3,
			              	lineColor: '#6E8141',
			              	states: {
			                	hover: {
			                  	enabled: true,
			                  	radius: 18,
			                  	lineWidth: 2
			                }
			              }
			            }
			        },
		        },
		        series: [
			        {
			            id: 'good',
			            name: 'Good',
			            zIndex:1,
            			color: '#FFCA64',
			            data: chartData.series.good,
			            states: {
			              	hover: {
			                	enabled: false
			              	}
			            }
		        	},
			        {
			            id: 'expected',
			            name: 'Expected',
			            zIndex:2,
            			color: '#70B7BA',
			            data: chartData.series.expected,
			        }, 
			        {
			            id: 'poor',
			            name: 'Poor',
			            zIndex:3,
            			color: '#fd6d83',
			            data: chartData.series.poor,
			            states: {
			              	hover: {
			                	enabled: false
			              	}
			            }
			        }, 	
			        {
			            id: 'very_poor',
			            name: 'Very Poor',
			            data: chartData.series.vPoor,
			            fillColor: '#fbfbfb',
			            zIndex:4,
			            lineWidth: 3,
            			color: '#E62F49	',
			        },
			        {
			            id: 'contributions',
			            name: 'Contributions Only',
			            data: chartData.series.contributions,
			            type:'line',
			            zIndex:4,
			            lineWidth: 2,
            			color: '#6E8141',
            			marker: {
			              	enabled: false,
						},
			            states: {
			              	hover: {
			                	enabled: false
			              	}
			            }
			        },
			        {
			            id: 'target_circle',
			            name: "target_circle",
			            color: 'rgba(145, 220, 255, 0.5)',
			            type: "scatter",
			            data: [[ parseInt(moment().add($scope.investment.horizon,'years').format('x')), $scope.investment.target_amt]]
			        }
		        ]
		    });
		});	
	}
	/*function that returns timestamp for today*/
	function getTimestampToday(){
		return parseInt(moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY').format('x'));
	}
	/*function that returns timestamp for n years after today*/
	function getTimestampAfter(years){
		return parseInt(moment(getTimestampToday()).add(years, 'years').format('x'));
	}
	/*preparing the chart data by passing the values*/
	function getChartData (projection_levels_data){

		var chartData 		= {};
		chartData.startDate = getTimestampToday();
		chartData.endDate  	= getTimestampAfter(parseInt($scope.investment.horizon)+1);
		chartData.series 	= calculateSeries ($scope.investment.initial_contribution, $scope.investment.horizon, projection_levels_data, $scope.investment.monthly_contribution);
		return chartData;
	}
	/* A calculation function that fills values for diffrent series according to 
	*	predefined farmula
	*/
	function calculateSeries (amt, horizon, data, monthly_contribution){

		var o 				= {};
		if(data.length){
			o.vPoor 		= fillSeriesData(vm.projection_levels[0], amt, horizon, data, monthly_contribution);
			o.poor 			= fillSeriesData(vm.projection_levels[1], amt, horizon, data, monthly_contribution);
			o.expected 		= fillSeriesData(vm.projection_levels[2], amt, horizon, data, monthly_contribution);
			o.good 			= fillSeriesData(vm.projection_levels[3], amt, horizon, data, monthly_contribution);
			o.contributions = fillContributions(amt, horizon, monthly_contribution);
		}
		return o;
	}
}
})();
