var Activitying = {
    //用的行数
    lines: [],
    //临时行数
    tempLines: [],
    //运行速度，保存时间
    speeds: [],
    init: function(ele, number, joined) {
        this.number = number;
    //    joined = Math.round(joined * 100 / number);

        //计算总行数
        var lines = (window.screen.height - 20) / 60;
        this.tempLines = [];
        for (var i = 0; i < lines; i++) {
            this.tempLines.push(i);
        }
        this.lines = this.tempLines.concat();

        var option = {
            tooltip: {
                formatter: "{a} <br/>{b} : {c}%"
            },
            series: [{
                name: '参与人数',
                type: 'gauge',
                detail: {
                    formatter: function(value) {
                        value = Math.round(value * number / 100);
                        return joined + '/' + number;
                    },
                    textStyle: {
                        color: theme == 1 ? '#000' : '#fff'
                    }
                },
                radius: '90%',
                data: [{
                    value: Math.round(joined * 100 / number),
                    name: ''

                }],
                splitLine: {
                    lineStyle: {
                        color: theme == 1 ? "#04ae84" : '#fff'
                    }
                },
                axisLine: { // 坐标轴线
                    lineStyle: { // 属性lineStyle控制线条样式
                        color: [
                            [0.2, '#0E8C6D'],
                            [0.8, '#82DBC5'],
                            [1, '#00FFC0']
                        ],
                        width: 8,
                    }
                },
                axisTick: { // 坐标轴小标记
                    show: false
                },
                pointer: {
                    width: 5
                }
            }]
        };
        var chart = echarts.init(ele);
        chart.setOption(option);
        this.option = option;
        this.chart = chart;
    },
    /**
     * 在init中将每一行保存下来，取出后删除，取完再初始化
     * @param {Object} joined
     * @param {Object} content
     * @param {Object} name
     */
    setNumber: function(joined, content, name) {

        if (this.tempLines.length == 0) {
            return;
        }
        if (this.lines.length == 0) {
            this.lines = this.tempLines.concat();
        }
        //joined = Math.round(joined * 100 / this.number);
        this.option.series[0].data[0].value = Math.round(joined * 100 / this.number);
		this.option.series[0].detail.formatter = joined + "/" + this.number;
        this.chart.setOption(this.option, true);

        var student = $('<div class="activity-student"></div>');
        student.html(name);

        var time = 8,
            timePlus = Math.random() * 15;

        //随机取剩下n行中的一个
        var lines = this.lines;
        var n = Math.floor(Math.random() * lines.length);
        var line = lines[n],
            lastTime = this.speeds[line] || 0;

        //当这一行和上一次速度相差大于2时 结束
        while (Math.abs(timePlus - lastTime) < 5) {
            timePlus = Math.random() * 15;
        }

        time += timePlus;

        this.speeds[line] = timePlus;

        student.css({
            animationName: 'anim-right2left',
            animationDuration: time + 's',
            animationTimingFunction: 'linear',
            top: line * 60
        });
        //删除这一行
        this.lines.splice(n, 1);
      
        content.append(student);
      

        setTimeout(function() {
            student.remove();
        }, time * 1200);
    }
}