(() => {
    let canvas
    let context
    let chartCtx
    let toggle
    let timer
    let particles = [];

    let myChart;

    var relDistances = []; // dataPoints
    var relVelocities = []; // dataPoints
    var chartConfig = {
        title :{
            text: "Relative distance and velocity observed by particle_0"
        },
        axisY: {
            includeZero: false
        },
        toolTip: {
            shared: true
        },
        legend: {
            cursor: "pointer",
            verticalAlign: "top",
            horizontalAlign: "center",
            dockInsidePlotArea: true,
            itemclick: toogleDataSeries
        },      
        data: [
            {
                type: "line",
                name: "distance",
                showInLegend: true,
                dataPoints: relDistances
            },
            {
                type: "line",
                name: "velocity",
                showInLegend: true,
                dataPoints: relVelocities
            }
        ]
    };
    let tick_count = 0;
    var tick_range = 401;
    var dataLength = 401; // number of dataPoints visible at any point
    var step_time = 1/60;
    var triggerTick = 100;
    var initial_dist = 300;
    var energy_boost = 300;

    var prev_rel_dist = 0;

    var tickText = document.getElementById('ticks');

    var canvas_w,
        canvas_h,
        fps = 30,
        bX = 30,
        bY = 30,
        mX = 150,
        mY = 300,
        lastTime = (new Date()).getTime(),
        currentTime = 0,
        delta = 0;

    
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    // function cutDecimals(number,integer, fraction){
    //     return number.toLocaleString('fullwide', {maximumSignificantDigits:integer, maximumFractionDigits:fraction})
    // }

    function cutDecimals(number, fraction){
        return number.toLocaleString('fullwide', { maximumFractionDigits:fraction});
    }

    const randomScalingFactor = () => {
        return (Math.random() > 0.5 ? 1.0 : -1.0) * Math.round(Math.random() * 100);
    }

    function toogleDataSeries(e){
        if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
        } else{
            e.dataSeries.visible = true;
        }
        chart.render();
    }

    var Point = function (x, y) {
        this.x = x;
        this.y = y;
        this.px = x;
        this.py = y;
        this.vx = 0;
        this.vy = 0;
        this.pin_x = null;
        this.pin_y = null;
    
        this.constraints = [];
    };
    
    var Particle = function (l, m, x, y, width, height) {
    
        this.mass = m;
        this.light = l;
        this.total = this.mass + this.light;
    
        this.ticks = 0;
    
        this.ratio = 0;                 // Acculated ticks - Universal clock ticks
        this.time = 0;                  // Absolute time
        this.distance = 0;              // Absolute distance this particle have traveled 
        this.dt = 0;
        this.ds = 0;

        this.prev_dist = 0;
        this.prev_time = 0;
    
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        // this.p1_x = x-width/2;
        // this.p1_y = y-height/2;
        // this.p2_x = x+width/2;
        // this.p2_y = y+height/2;
    
        this.point = new Point( x, y );

        this.resolve();
    };

    Particle.prototype.addEnergy = function (energy) {
        this.light += energy;
        if ( this.light < 0 )
            this.light = 0;
        
        this.resolve();
    }

    Particle.prototype.addMass = function (mass) {
        this.mass += mass;
        if ( this.mass < 0 )
            this.mass = 0;

        this.resolve();
    }

    Particle.prototype.update = function (tick) {
        this.ticks += tick;
        // update distance
        this.distance = this.ratio * tick;
    
        // update time
        this.time = this.ratio * tick;
    }

    Particle.prototype.step = function (delta) {
        this.ticks += delta;

        this.dt = this.ratio * delta;
        this.ds = this.ratio * delta;

        // save for backup
        this.prev_dist = this.distance;
        this.prev_time = this.time;

        // update distance
        this.distance += this.ds;
    
        this.x += this.ds;

        // update time
        this.time += this.dt;
    }
    
    Particle.prototype.resolve = function () {
        var p = 1 - Math.pow(this.light, 2)/Math.pow( (this.light+this.mass), 2);
        this.ratio = 1/Math.sqrt(p) - 1;
    }
    
    Particle.prototype.draw = function () {
    
        context.beginPath();
    
        var p1x = this.x - this.width/2;
        var p1y = this.y - this.height/2;
        context.rect( p1x, p1y, this.width, this.height);
        context.fillStyle = 'yellow';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = 'black';

        context.font = "16px monospace";
        context.fillStyle = "black";
        context.textAlign = "left";

        var p = "p=" + this.light + ",q=" + this.mass + ",ratio=" + cutDecimals(this.ratio,4) + ", s=" + cutDecimals(this.distance,2).padStart(6,'0') + ",time=" + cutDecimals(this.time,2).padStart(6,'0');
        context.fillText( p, p1x+10, p1y);
    
        context.stroke();
    };

    const updateChart = (tick, distValue, velValue) => {
        relDistances.push( {
            x: tick,
            y: distValue
        });
        if (relDistances.length > dataLength) {
            relDistances.shift();
        }
        relVelocities.push( {
            x: tick,
            y: velValue
        });
        if (relVelocities.length > dataLength) {
            relVelocities.shift();
        }
        myChart.render();

        
    }

    const gameLoop = () => {
        if ( tick_count < tick_range ) {

            window.requestAnimationFrame(gameLoop);

            currentTime = (new Date()).getTime();
            delta = (currentTime - lastTime) / 1000;

            if ( delta > step_time ) {
                context.clearRect(0, 0, canvas_w, canvas_h);

                var i = particles.length;
                while (i--) {
                    particles[i].step( 1 );
                    particles[i].draw();
                }
            
                lastTime = currentTime;

                tickText.innerHTML = "Tick=" + tick_count;

                var physical_dist = (particles[1].x) - ( particles[0].x);
                var rel_dist = (particles[1].distance) - ( particles[0].distance);


                var rel_vel= (physical_dist-prev_rel_dist) / particles[0].dt;

                prev_rel_dist = physical_dist;
                // update chart
                
                updateChart(tick_count, physical_dist, rel_vel);

                // Apply energy boost
                if ( tick_count == triggerTick )
                    particles[1].addEnergy(energy_boost);
                tick_count++;
            }
        }
    }

    const init = () => {
        canvas = document.getElementById('canvas')
        canvas_w = canvas.width;
        canvas_h = canvas.height;

        context = canvas.getContext('2d')

        var e0 = new Particle(50, 50, 20+initial_dist, 40, 10, 15);
        // e0.resolve();
        var e1 = new Particle(50, 50, 20, 90, 10, 15);
        // e1.resolve();

        particles.push(e0);
        particles.push(e1);

        prev_rel_dist = e1.x - e0.x;

        // Setup for chart
        // chartCtx = document.getElementById("myChart").getContext('2d');
        myChart = new CanvasJS.Chart("chartContainer", chartConfig);
        
        gameLoop();
    }
  
    init()
  
  })()