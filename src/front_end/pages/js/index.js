// 参数数据
// 该对象的所有属性getter均被绑定到页面
params = {
    task:0,
    type:"",
    time:0,
    height:0,
    latLb:0,
    latUb:0,
    lonLb:0,
    lonUb:0,
    filename:''//TODO 数据绑定
}

// 统计数据
// 该对象的所有属性setter均被绑定到页面
statics = {
    min:0,
    max:0,
    avg:0,
    sdev:0 // TODO 计算标准差
}

// 异步获取数据，避免UI阻塞
async function getData(){
    let rawData
    switch (params.task){
        case 0:
            rawData = funcInjector.GetHeatMapData(params)
            break
        case 1:
        case 2:
            rawData = funcInjector.GetContourMapData(params)
    }
    return JSON.parse(rawData)
}

// 绑定提交参数事件
document.querySelector("#submit-param").onclick=()=>{
    getData()
        .then(rawData => {
            switch (params.task){
                case 0:
                    drawHeatMap(rawData)
                    break
                case 1:
                case 2:
                    drawContourMapData(rawData)
            }
        })
        .catch(e=> {
            mdui.alert(e.toString())
        })
}

// 通过value动态生成类型选择组件
function getTypeSelHtml(value,isChecked){
    return `<label class="mdui-radio">
<input type="radio" name="type-selector" value="${value}"
${isChecked?"checked":""} />
<i class="mdui-radio-icon"></i>
${value}
</label>`
}
// 通过value动态生成文杰列表项
function getFileListHtml(value){
    return `<li class="mdui-list-item mdui-ripple">${value}</li>
            <li class="mdui-divider"></li>`
}

// 动态添加type组件
function fetchTypes(){
    let types = funcInjector.GetFileInfo()
    types = types
        .toString()
        .slice(1,types.toString().length-1)
        .replace(/\s+/g,'')
        .split(',')
    let html = ""
    html = html + getTypeSelHtml(types[0], true)
    for (let i = 1; i < types.length; i++)
        html = html + getTypeSelHtml(types[i], false)
    mdui.$("#type-selector").append(html)
    mdui.$("#type-selector").mutation()
}
// 动态添加文件列表组件
function fetchFileList(){
    let filelist = funcInjector.GetFileList()
    let files=[]
    files = filelist
        .toString()
        .slice(1,filelist.toString().length-1)
        .replace(/\s+/g,'')
        .split(',')
    let html = ""
    for (let i = 0; i < files.length; i++)
        html = html + getFileListHtml(files[i])
    mdui.$("#file-list").append(html)
    mdui.$("#file-list").mutation()
}

function changetype()
{
    all_information=funcInjector.Getinformation(params)
    alert(all_information)

}


function drawHeatMap(rawData){
    //TODO 横纵坐标应按照经纬度重新生成
    let xData=[]
    let yData=[]
    let data = []
    let min = rawData[0][0]
    let max = rawData[0][0]
    let sum = 0
    let count = 0
    //采样（为了保证速度）
    let cx=2,cy=2;
    if(rawData[0].length>1400)
    {
        cx=3;cy=3;
    }
    for(let x=0;x+cx<rawData.length;x=x+cx){
        xData.push(x);
        for(let y=0;y+cy<rawData[0].length;y=y+cy)
        {
            let now=0;
            for(let i=0;i<cx;i++)
                for(let j=0;j<cy;j++)
                    now=now+rawData[x+i][y+j]
            rawData[x][y]=now/(cx*cy);
            max = Math.max(rawData[x][y],max)
            min = Math.min(rawData[x][y],min)
            sum += rawData[x][y]
            count++
            data.push([x/cx,y/cy,rawData[x][y]])
        }
    }
    statics.min = min
    statics.max = max
    statics.avg = sum / count
    for(let y=0;y<rawData[0].length;y=y+cy)
        yData.push(y);
    let option = {
        tooltip: {},
        xAxis: {
            type: 'category',
            data: xData
        },
        yAxis: {
            type: 'category',
            data: yData
        },
        visualMap: {
            min: min,
            max: max,
            calculable: true,
            realtime: false,
            inRange: {
                color: [
                    '#313695',
                    '#4575b4',
                    '#74add1',
                    '#abd9e9',
                    '#e0f3f8',
                    '#ffffbf',
                    '#fee090',
                    '#fdae61',
                    '#f46d43',
                    '#d73027',
                    '#a50026'
                ]
            }
        },
        series: [
            {
                name: 'Gaussian',
                type: 'heatmap',
                data: data,
                emphasis: {
                    itemStyle: {
                        borderColor: '#333',
                        borderWidth: 1
                    }
                },
                progressive: 10000,
                animation: false
            }
        ]
    };
    let chartDom = echarts.init(document.querySelector("#chart"));
    chartDom.setOption(option)
    //TODO 热力图标准差计算
}

function drawContourMapData(rawData){
    let data = []
    let ydata = []
    let min = rawData[0]
    let max = rawData[0]
    let sum = 0
    let count = 0
    for(let i=0;i<rawData.length;i++) {
        ydata.push(i)
        data.push(rawData[i])
        max = Math.max(rawData[i],max)
        min = Math.min(rawData[i],min)
        sum += rawData[i]
        count++
    }
    statics.max = max
    statics.min = min
    statics.avg = sum / count
    let option = {
        //TODO 修改坐标轴文字标题等
        legend: {
            data: ['Altitude (km) vs. temperature (°C)']
        },
        tooltip: {
            trigger: 'axis',
            formatter: 'Temperature : <br/>{b}km : {c}°C'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value} °C'
            },
        },
        yAxis: {
            type: 'category',
            axisLine: { onZero: false },
            axisLabel: {
                formatter: '{value} km'
            },
            boundaryGap: false,
            data: ydata
        },
        visualMap: {
            min: min,
            max: max,
            calculable: true,
            realtime: true,
            inRange: {
                color: [
                    '#313695',
                    '#4575b4',
                    '#74add1',
                ]
            }
        },
        series: [
            {
                name: 'Altitude (km) vs. temperature (°C)',
                type: 'line',
                symbolSize: 10,
                symbol: 'circle',
                smooth: true,
                lineStyle: {
                    width: 3,
                    shadowColor: 'rgba(0,0,0,0.3)',
                    shadowBlur: 10,
                    shadowOffsetY: 8
                },
                data: data
            }
        ]
    };
    let chartDom = echarts.init(document.querySelector("#chart"));
    chartDom.setOption(option)
}
