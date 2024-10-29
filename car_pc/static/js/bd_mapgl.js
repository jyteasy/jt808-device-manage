
// -------百度地图API调用相关功能开始--------//

 // 创建Map实例
let importBaiDuMapApi = function(map_key,func_name){

  var map_script = document.createElement("script")
  map_script.type="text/javascript" 
  map_script.src ="https://api.map.baidu.com/api?v=1.0&type=webgl&ak="+map_key+"&callback="+func_name
  $("body").append(map_script)
}

var create_map_ins = function(dom){
  var map = new BMapGL.Map(dom); 
  map.centerAndZoom(new BMapGL.Point(116.404, 39.815), 12);  // 初始化地图,设置中心点坐标和地图级别
  //添加地图类型控件
  map.addControl(new BMapGL.MapTypeControl({
    mapTypes:[
            BMAP_NORMAL_MAP,
            BMAP_EARTH_MAP

        ]}));   
  // map.setCurrentCity("北京");          // 设置地图显示的城市 此项是必须设置的
  map.enableScrollWheelZoom(true);
  map.enableAutoResize();

  var scaleCtrl = new BMapGL.ScaleControl();  // 添加比例尺控件
  map.addControl(scaleCtrl);
  var zoomCtrl = new BMapGL.ZoomControl();  // 添加缩放控件
  map.addControl(zoomCtrl);

  var navi3DCtrl = new BMapGL.NavigationControl3D();  // 添加3D控件
  map.addControl(navi3DCtrl);

  // 创建定位控件
  var locationControl = new BMapGL.LocationControl({
      // 控件的停靠位置（可选，默认左上角）
      anchor: BMAP_ANCHOR_BOTTOM_LEFT,
      // 控件基于停靠位置的偏移量（可选）
      offset: new BMapGL.Size(20, 20)
  });
  // 将控件添加到地图上
  map.addControl(locationControl);

   // 创建城市选择控件
  var cityControl = new BMapGL.CityListControl({
      // 控件的停靠位置（可选，默认左上角）
      anchor: BMAP_ANCHOR_TOP_LEFT,
      // 控件基于停靠位置的偏移量（可选）
      offset: new BMapGL.Size(10, 5)
  });
  // 将控件添加到地图上
  map.addControl(cityControl);

  return map
}

var add_marker_bdmap = function(mapobj,marker_data){
  let m = marker_obj_on_map[marker_data.device_id]
  if(!m){
    marker_obj_on_map[marker_data.device_id] = add_device_marker_bdmap(mapobj,marker_data)
  }else{
    
    let point = m.getPosition()
    // map.panTo(point)
    m.info_window.setContent(device_window_htm(marker_data))
    map.openInfoWindow(m.info_window,point)
  }
}

var remove_marker_bdmap = function(mapobj,device_id){
  // console.log(idx,marker_list)
  var m = marker_obj_on_map[device_id]
  if(m){
    mapobj.closeInfoWindow()
    mapobj.removeOverlay(m)
    delete marker_obj_on_map[device_id]
    $("#track-"+device_id).remove()
  }
}

//百度地图添加设备marker覆盖物功能函数
var current_marker;
var add_device_marker_bdmap=function(mapobj,dev){
  mapobj.centerAndZoom(point, 15);
  var point = new BMapGL.Point(0,0)

  if(dev.lng !== "" && dev.lat != ""){
    // 纠偏
    point = wgs_to_bdmap_point(dev.lng,dev.lat)
  }

  var myIcon = new BMapGL.Icon("/static/img/default.png", new BMapGL.Size(50,50),{anchor : new BMapGL.Size(20, 42),imageSize:new BMapGL.Size(50, 50)});
  var marker = new BMapGL.Marker(point,{icon:myIcon});
  
  marker.self_detail= dev
  marker.addEventListener('click', function (e) {
    let pt = e.target.getPosition()
    mapobj.openInfoWindow(e.target.info_window,pt)
  })
  mapobj.addOverlay(marker);//加载定位点
  createrTrackingHtml(mapobj,dev);//添加追踪栏信息
  marker.setTitle(dev.name);//设置标题

  marker.info_window = create_infowindow_bdmap(dev)
  mapobj.openInfoWindow(marker.info_window,point) 
  mapobj.panTo(point)
  if(dev.lng !== "" && dev.lat != ""){
    get_bdmap_addr(point,dev.device_id)
  }
  
  return marker
};

var add_default_marker_bdmap=function(mapobj,dev,idx){
  mapobj.centerAndZoom(point, 15);
  var point = new BMapGL.Point(0,0)
  if(dev.lng !== "" && dev.lat != ""){
    // 纠偏
    point = wgs_to_bdmap_point(dev.lng,dev.lat)
  }
  var marker = new BMapGL.Marker(point);
  mapobj.addOverlay(marker);//加载定位点
  mapobj.panTo(point)
  if(dev.lng !== "" && dev.lat != ""){
    get_bdmap_addr(point,dev.device_id,idx)
  }
  return marker
};

var marker_obj_on_map = {}

//设备定位点信息窗展示功能
var create_infowindow_bdmap=function(dev){
  var htm = device_window_htm(dev)
  //信息窗口参数722,1536
  var opts = {
    width : 200,     // 信息窗口宽度
    height: 250,     // 信息窗口高度
    offset:new BMapGL.Size(0, -32)
  };

  var marker_info_window = new BMapGL.InfoWindow(htm, opts,{anchor : new BMapGL.Size(20, 42)});

  return marker_info_window
};
var device_window_htm = function(dynamic){

  var info_window_baidu=`<div class="trail-item" style="display:flex;flex-direction:column">
                          <p style="margin-top:5px">设备号:`+dynamic.device_id+`</p>
                          <p style="margin-top:5px">状态:`+dynamic.status+`</p>
                          <p style="margin-top:5px">速度:`+dynamic.speed+`</p>
                          <p style="margin-top:5px">接收时间:`+dynamic.recv_ts+`</p>
                          <p style="margin-top:5px">定位时间:`+dynamic.track_ts+`</p>
                          <p style="margin-top:5px">经纬度:`+dynamic.lng+","+dynamic.lat+`</p>
                          <p style="margin-top:5px" id="window-info-marker-addr"></p>
                        </div>`

  return info_window_baidu
}

var trail_marker_on_map = {}
var createrTrackingHtml = function(mapobj,dynamic,trail){

  let dom_id = "track-"+dynamic.device_id
  if (trail){
    dom_id = "trail-"+trail
  }
  let addr_id = dom_id + "-addr"

  var info_window_baidu=`<div class="trail-item" style="display:flex;margin-top:5px" id=`+dom_id+` status="off">
                          <p style="margin-left:5px">设备号:`+dynamic.device_id+`</p>
                          <p style="margin-left:15px">状态:`+dynamic.status+`</p>
                          <p style="margin-left:15px">速度:`+dynamic.speed+`</p>
                          <p style="margin-left:15px">接收时间:`+dynamic.recv_ts+`</p>
                          <p style="margin-left:15px">定位时间:`+dynamic.track_ts+`</p>
                          <p style="margin-left:15px">经纬度:`+dynamic.lng+","+dynamic.lat+`</p>
                          <p style="margin-left:15px" id=`+addr_id+`></p>
                        </div>`
  $("#track-panel").append(info_window_baidu)

  // 轨迹点处理
  if (trail != null){
    // console.log("trail-item-obj",$("#"+dom_id))
    $("#"+dom_id).on("click",{data:dynamic,trail:trail},function(e){
      let data = e.data.data
      let trail = e.data.trail
      let status = $(this).attr("status")
      let idx = $(this).attr("id") + "-addr"
      // console.log("trail",trail,status)
      if (status == "off"){
        trail_marker_on_map[idx] = add_default_marker_bdmap(mapobj,data,idx)
        $(this).attr("status","on")
      }else if (status == "on"){
        let trail_marker = trail_marker_on_map[idx]
        if (trail_marker){
          mapobj.removeOverlay(trail_marker)
          delete trail_marker_on_map[idx]
        }
        $(this).attr("status","off")
      }
    })
  }else{
    // 设备追踪点处理
    $("#"+dom_id).on("click",{device_id:dynamic.device_id},function(e){
      console.log("track,",e.data.device_id)
      let dev = marker_obj_on_map[e.data.device_id]
      if (dev){
        let point = dev.getPosition()
        mapobj.panTo(point)
      }
    })
  }
}

// 地址逆解析，从经纬度变成文字地址，百度接口
var get_bdmap_addr=function(pt,device_id,trail){
  var geoc = new BMapGL.Geocoder();  //地理位置逆解析
  var location
  geoc.getLocation(pt, function(rs){
    console.log("get_bdmap_addr",rs)
    var addComp = rs.address
    if(rs.content.poi_desc!=null){
      location=addComp+','+rs.content.poi_desc
    }else{
      location=addComp
    }
    
    if (trail){
      $("#"+trail).text(location)
      trail_marker_on_map[trail].addr=location;
    }else{
      marker_obj_on_map[device_id].self_detail.addr=location;
      $("#window-info-marker-addr").text(location)
      $("#track-"+device_id+"-addr").text(location)
    }
    
  });
};

// 画线功能
var draw_line_bdmap=function(mapobj,pts){

    sIcon = new BMapGL.Icon("/static/img/start.png", new BMapGL.Size(40,40),{anchor : new BMapGL.Size(20, 42),imageSize:new BMapGL.Size(40, 40)});
    eIcon = new BMapGL.Icon("/static/img/end.png", new BMapGL.Size(40,40),{anchor : new BMapGL.Size(20, 42),imageSize:new BMapGL.Size(40,40)});

    var sp = new BMapGL.Point(pts[0].lng,pts[0].lat);
    var ep = new BMapGL.Point(pts[pts.length-1].lng,pts[pts.length-1].lat);
    
    var sMarker = new BMapGL.Marker(sp,{icon:sIcon});
    var eMarker = new BMapGL.Marker(ep,{icon:eIcon});

    var polyline = new BMapGL.Polyline(pts, {
        strokeColor:"#18a45b",//设置颜色
        strokeWeight:7 ,//宽度
        strokeOpacity:0.8,//折线的透明度，取值范围0 - 1
        enableEditing: false,//是否启用线编辑，默认为false
        enableClicking: false,//是否响应点击事件，默认为true
        // icons:[icons]
    });
    mapobj.addOverlay(polyline)
    mapobj.setViewport(pts);

    mapobj.addOverlay(sMarker)
    mapobj.addOverlay(eMarker)

  return polyline
}

// 纠偏
var wgs_to_bdmap_point = function(lng,lat){
  var lng = parseFloat(lng)
  var lat = parseFloat(lat)
  // 地址纠偏
  var lnglat = wgs84_bdmap(lat,lng)
  lng = lnglat[0]
  lat = lnglat[1]
  point = new BMapGL.Point(lng,lat)
  return point
}


var package_trail_point = function(data){
  var pts = copy_func(data)
  var ptarry = []
  for(var i=0;i<pts.length;i++){
    var lng=parseFloat(pts[i]['lng'])
    var lat=parseFloat(pts[i]['lat'])
    // 纠偏，wgs84->bdmap
    var lnglat = wgs84_bdmap(lat,lng)
    lng = lnglat[0]
    lat = lnglat[1]
    // 获取距离
    var trail = new BMapGL.Point(lng,lat);
    trail.detail = pts[i]
    trail.title ='<div>'+pts[i]['recv_ts']+'</div><div>'+pts[i]['speed']+'km/h</div>'
    ptarry.push(trail);
  };
  return ptarry
}

var TrailObjBaiDuMap = function(bdmap,points,terminal,detailPanel,slider_dom){
  if(points.length < 2 || !points || !bdmap){
    return
  }
  let that = this

  this.terminal = terminal
  this.map = bdmap
  this.moverMarker
  this.markerIcon = '/static/img/trail.png'
  this.moveInterval// 循环
  this.IntervalTimer = 100 // 移动间隔
  this.step=10 //步长
  this.moveSpeed=5
  this.status = "stop" //播放状态，run,pause,stop
  this.points = points //设备上传点位
  this.BMapPoints = [] //原始点位转换百度地图点位
  this.MovePoints = [] //百度坐标点，按照步长切割为移动点位
  this.detailPanel = detailPanel
  if(this.detailPanel){
    this.detailPanel.empty()
  }

  this.map.clearOverlays()

  this.packageBMapPoints = function(data){
    var pts = copy_func(data)
    for(var i=0;i<pts.length;i++){
      var lng=parseFloat(pts[i]['lng'])
      var lat=parseFloat(pts[i]['lat'])
      // 纠偏，wgs84->bdmap
      var lnglat = wgs84_bdmap(lat,lng)
      lng = lnglat[0]
      lat = lnglat[1]
      // 获取距离
      var trail = new BMapGL.Point(lng,lat);
      trail.detail = pts[i]
      trail.title ='<div>'+pts[i]['recv_ts']+'</div><div>'+pts[i]['speed']+'km/h</div>'
      this.BMapPoints.push(trail);
    };
    // var trail_points_show = new BMapGL.PointCollection(this.BMapPoints, {size: BMAP_POINT_SIZE_NORMAL,shape: BMAP_POINT_SHAPE_CIRCLE,
    // color: '#18a45b'});

    // trail_points_show.addEventListener('click', function (e) {
    //   console.log("trailpoint",e)
    // })
    // this.map.addOverlay(trail_points_show)

    
  }
  this.packageBMapPoints(this.points)

  this.DrawLine = function(bmapPoint){
    
    var d = copy_func(bmapPoint)

    mIcon = new BMapGL.Icon(this.markerIcon, new BMapGL.Size(40, 40),{anchor : new BMapGL.Size(20, 20),imageSize:new BMapGL.Size(40, 40)});
    sIcon = new BMapGL.Icon("/static/img/start.png", new BMapGL.Size(40,40),{anchor : new BMapGL.Size(20, 42),imageSize:new BMapGL.Size(40, 40)});
    eIcon = new BMapGL.Icon("/static/img/end.png", new BMapGL.Size(40,40),{anchor : new BMapGL.Size(20, 42),imageSize:new BMapGL.Size(40,40)});

  
    var sp = new BMapGL.Point(d[0].lng,d[0].lat);
    var ep = new BMapGL.Point(d[d.length-1].lng,d[d.length-1].lat);
    
    this.moverMarker = new BMapGL.Marker(sp,{icon:mIcon});
    var sMarker = new BMapGL.Marker(sp,{icon:sIcon});
    var eMarker = new BMapGL.Marker(ep,{icon:eIcon});

    var polyline = new BMapGL.Polyline(bmapPoint, {
        strokeColor:"#18a45b",//设置颜色
        strokeWeight:7 ,//宽度
        strokeOpacity:0.8,//折线的透明度，取值范围0 - 1
        enableEditing: false,//是否启用线编辑，默认为false
        enableClicking: false,//是否响应点击事件，默认为true
        // icons:[icons]
    });
    this.map.addOverlay(polyline)
    this.map.setViewport(d);

    this.map.addOverlay(sMarker)
    this.map.addOverlay(eMarker)
    this.map.addOverlay(this.moverMarker)
    
  }

  this.DrawLine(this.BMapPoints)

  this.packageMovePoints = function(bmapPoint){
    var d = copy_func(bmapPoint)
    for(var i=0;i<d.length;i++){
      d[i].idx = i+1
      if(i == d.length-1){
        this.MovePoints.push(d[i])
        break
      }
      var sPoint = WGS84ToWebMercator(d[i].lng,d[i].lat);
      var ePoint = WGS84ToWebMercator(d[i+1].lng,d[i+1].lat);
      
      var dis = Math.sqrt(Math.pow(ePoint[0] - sPoint[0], 2) + Math.pow(ePoint[1] - sPoint[1], 2));
      var count = parseInt(dis/this.step)
      
      if(count<1){
        this.MovePoints.push(d[i])
        continue
      }
      this.MovePoints.push(d[i])
      for(var n=1;n<count;n++){
        var x = GetTargetXY(sPoint[0],ePoint[0],n,count)
        var y = GetTargetXY(sPoint[1],ePoint[1],n,count)
        var wgs84p = MercatorToWGS84(x,y)
        var mp = new BMapGL.Point(wgs84p[0],wgs84p[1]);
        mp.idx = i+1
        this.MovePoints.push(mp)
      }

    }
    // console.log("ePoint,sPoint",ePoint,sPoint,dis,count,this.MovePoints)

  }
  this.packageMovePoints(this.BMapPoints)

  this.currentMove = 0

  this.start = function(){

    if(that.moveInterval){
      return
    }

    that.moveInterval = setInterval(function(){
      that.move_func()
    },that.IntervalTimer)

  }

  this.move_func = function(){
    
    var tgt = that.MovePoints[that.currentMove]
    // 头部标签和详情栏信息
    if (tgt.title){
      that.setTitle(tgt)
      var p = new BMapGL.Point(tgt.lng,tgt.lat)
      var direct = parseInt(tgt.detail.direct) == NaN?0:parseInt(tgt.detail.direct)
      if(direct !== 0){
        that.moverMarker.setRotation(direct)
      }
      that.moverMarker.setPosition(p)
      // 地图跟随
      if(map_follow){
        that.map.panTo(p)
      }

    }else{
      that.moverMarker.setPosition(tgt)
    }
    var perc = parseInt((that.currentMove/that.MovePoints.length)*100)
    element.progress(slider_dom, perc+"%");

    var mpl = that.MovePoints.length

    if (that.moveSpeed > 1){
      for(var i=0;i<that.moveSpeed-1;i++){
        var idx = that.currentMove+i+1
        if(idx>=mpl){
          break
        }
        var tgt = that.MovePoints[idx]
        if (tgt.title){
          that.setTitle(tgt)
        }
      }
    }
    that.currentMove += that.moveSpeed

    if(that.currentMove >= mpl){
      that.currentMove = 0
      that.status = "stop"
      var lp = new BMapGL.Point(that.MovePoints[mpl-1].lng,that.MovePoints[mpl-1].lat)
      that.moverMarker.setPosition(lp)
      element.progress(slider_dom, "100%");
      layer.msg(parent.langcm["play_end"])
      clearInterval(that.moveInterval)
      that.moveInterval = null
      return
    }

    if(that.status == "pause"){
      that.status == "stop"
      clearInterval(that.moveInterval)
      that.moveInterval = null
    }else if(that.status == "stop"){
      that.currentMove = 0
      element.progress(slider_dom, "0%");
      var p = new BMapGL.Point(that.MovePoints[0].lng,that.MovePoints[0].lat)
      that.moverMarker.setPosition(p)
      clearInterval(that.moveInterval)
      that.moveInterval = null
    }
  }


  this.setTitle = function(tgt){
    var mylabel = that.moverMarker.getLabel()
    if(mylabel){
      mylabel.setContent(tgt.title)
    }else{
      var mylabel=new BMapGL.Label(tgt.title,{offset:new BMapGL.Size(tgt.title.length/2*-1,-30)});
      mylabel.setStyle({border:'0',borderRadius:"3px",padding:"2px"})
      that.moverMarker.setLabel(mylabel);
    }
    
    
  }

  this.fillDetailPanel = function(){
    if(that.detailPanel){
      let htm = ""
      that.BMapPoints.forEach((tgt,idx)=>{
        let g = tgt.detail
        let ter = {dev:g,device_id:"",name:"",alarms:[]}
        let p = get_terminal_param(ter)
        var dom_id = "terminal_"+g.id
        let fz = "font-size:"+(get_height/70).toFixed()+"px"
        var detailHtml = `<div id=`+dom_id+` data-idx=`+idx.toString()+` class="trail-detail hover-gray" style="width:100%;display:flex;align-items:center;`+fz+`">
                            <div style="`+fz+`;width:2%">`+(idx+1).toString()+`</div>
                            <div style="`+fz+`;width:10%;display:flex" >
                              <p data-lang="mileage">`+parent.langcm["mileage"]+`</p>
                              <p>:`+g.mileage+`km</p>
                            </div>

                            <div style="`+fz+`;width:8%;display:flex" >
                              <p data-lang="speed">`+parent.langcm["speed"]+`</p>
                              <p>:`+g.speed+`km/h</p>
                            </div>

                            <div style="`+fz+`;width:5%;display:flex" >
                              <p data-lang="direct">`+parent.langcm["direct"]+`</p>
                              <p>:`+g.direct+`°</p>
                            </div>

                            <div style="`+fz+`;width:25%;display:flex" >
                              <p data-lang="location">`+parent.langcm["location"]+`</p>
                              <p>:`+g.lng+","+g.lat+`,</p>
                              <div class="tracking-terminal-location" name=`+dom_id+`></div>
                            </div>

                            <div style="`+fz+`;width:12%;display:flex" >
                              <p data-lang="track">`+parent.langcm["track"]+`</p>
                              <p>:`+g.track_ts+`</p>
                            </div>

                            <div style="`+fz+`;width:12%;display:flex" >
                              <p data-lang="receive">`+parent.langcm["receive"]+`</p>
                              <p>:`+g.recv_ts+`</p>
                            </div>

                            <div style="`+fz+`;width:10%;display:flex" >
                              <p data-lang="alarm_on">`+parent.langcm["alarm_on"]+`</p>
                              <p>:`+p.alarm_info+`</p>
                            </div>

                            <div style="`+fz+`;width:16%;display:flex" >
                              <p data-lang="param">`+parent.langcm["param"]+`</p>
                              <p>:`+p.battery+p.rssi+p.gnss+p.acc+p.track+`</p>
                            </div>

                          </div>`
        
        htm += detailHtml
      })
      that.detailPanel.empty()
      that.detailPanel.append(htm)
      $(".trail-detail").off()
      $(".trail-detail").on("click",function(e){
        let ect = e.currentTarget
        let idx = $(this).data("idx")

        idx = parseInt(idx)
        // console.log("trail-detail idx==>",e,idx)
        var d = that.BMapPoints[idx]
        var p = new BMapGL.Point(d.lng,d.lat)
        that.map.panTo(p)
        

        let clickStatus = $(this).data("clickStatus")
        if (clickStatus == "click"){
          $(this).css("background-color","")
          $(this).data("clickStatus","")
          that.map.removeOverlay(that.clickTrailPoint[ect.id])
        }else{
          $(this).css("background-color","gray")
          $(this).data("clickStatus","click") 
          let clickTrailPoint = new BMapGL.Marker(p);
          that.map.addOverlay(clickTrailPoint)
          that.clickTrailPoint[ect.id] = clickTrailPoint
        }

        if(all_addr_obj[ect.id]){
          return
        }
        get_bdmap_addr(p,ect.id)
        // setTimeout(function(){
        //   var origin = $("#"+e.target.id).text()
        //   $("#"+e.target.id).text(origin+all_addr_obj[e.target.id])
          
        // },1000)
      })
    }
  }
  this.clickTrailPoint={};
  this.fillDetailPanel()

  this.controlButton = function(k){
    
    switch(k){
    case"run":
      if(that.status != k){
        // if(that.status == "stop"){
        //   that.detailPanel.empty()
        // }
        that.status = k
        that.start()
      }
      break
    case"pause":
      that.status = k
      break
    case"stop":
      that.status = k
      break
    case"move_fast":
      that.IntervalTimer -= 100
      if (that.IntervalTimer < 1){
        that.IntervalTimer = 1
      }
      
      clearInterval(that.moveInterval)
      that.moveInterval = null
      that.start()
      break
    case"move_slow":
      that.IntervalTimer += 100
      if (that.IntervalTimer > 1000){
        that.IntervalTimer = 1000
      }
      
      clearInterval(that.moveInterval)
      that.moveInterval = null
      that.start()
      break

    }
  }

}

// 在转墨卡托坐标之后，本次移动的目标坐标点，初始坐标点的值+本次移动序号/总移动次数*（目标坐标点-初始坐标点）
var GetTargetXY = function(initPos, targetPos, currentCount, count) {
  var b = initPos, c = targetPos - initPos, t = currentCount,d = count;
  return c * t / d + b;
}

var MercatorToWGS84 = function(x, y) {
    const originShift = Math.PI * 6378137;
    const lon = (x / originShift) * 180;
    let lat = (y / originShift) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lon, lat];
}
 
var WGS84ToWebMercator = function(lng, lat) {
    var PI = Math.PI;
    var x = lng * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lat) * PI / 360)) / (PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y];
}

// #wgs84坐标系转换成百度坐标系计算函数
function wgs84_bdmap(input_lat,input_lng){

  var pi = 3.1415926535897932384626;
  var a = 6378245.0;
  var ee = 0.00669342162296594323;
  var x_pi = 3.14159265358979324 * 3000.0 / 180.0;


  function wgs2bd(lat, lon){ 
         _wgs2gcj = wgs2gcj(lat, lon);
         _gcj2bd = gcj2bd(_wgs2gcj[0], _wgs2gcj[1]);
         return _gcj2bd;
     }
  

  function gcj2bd(lat, lon){
         x = lon
         y = lat
         z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
         theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
         bd_lon = z * Math.cos(theta) + 0.0065;
         bd_lat = z * Math.sin(theta) + 0.006;
         return [ bd_lat, bd_lon ];
     }
  

  function bd2gcj(lat, lon){ 
         x = lon - 0.0065
         y = lat - 0.006
         z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
         theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
         gg_lon = z * Math.cos(theta);
         gg_lat = z * Math.sin(theta);
         return [ gg_lat, gg_lon ];
     }
  

  function wgs2gcj(lat, lon){ 
         dLat = transformLat(lon - 105.0, lat - 35.0);
         dLon = transformLon(lon - 105.0, lat - 35.0);
         radLat = lat / 180.0 * pi;
         magic = Math.sin(radLat);
         magic = 1 - ee * magic * magic;
         sqrtMagic = Math.sqrt(magic);
         dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
         dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
         mgLat = lat + dLat;
         mgLon = lon + dLon;
         return [ mgLat, mgLon ]
     }
  

  function transformLat(lat, lon){ 
         ret = -100.0 + 2.0 * lat + 3.0 * lon + 0.2 * lon * lon + 0.1 * lat * lon + 0.2 * Math.sqrt(Math.abs(lat));
         ret += (20.0 * Math.sin(6.0 * lat * pi) + 20.0 * Math.sin(2.0 * lat * pi)) * 2.0 / 3.0;
         ret += (20.0 * Math.sin(lon * pi) + 40.0 * Math.sin(lon / 3.0 * pi)) * 2.0 / 3.0;
         ret += (160.0 * Math.sin(lon / 12.0 * pi) + 320 * Math.sin(lon * pi  / 30.0)) * 2.0 / 3.0;
         return ret;
     }
  

  function transformLon(lat, lon){ 
         ret = 300.0 + lat + 2.0 * lon + 0.1 * lat * lat + 0.1 * lat * lon + 0.1 * Math.sqrt(Math.abs(lat));
         ret += (20.0 * Math.sin(6.0 * lat * pi) + 20.0 * Math.sin(2.0 * lat * pi)) * 2.0 / 3.0;
         ret += (20.0 * Math.sin(lat * pi) + 40.0 * Math.sin(lat / 3.0 * pi)) * 2.0 / 3.0;
         ret += (150.0 * Math.sin(lat / 12.0 * pi) + 300.0 * Math.sin(lat / 30.0 * pi)) * 2.0 / 3.0;
         return ret;
      }

  wgs2bd=wgs2bd(input_lat,input_lng)
  wgs2bd.reverse()
  return wgs2bd

}
