# jt808-device-manage
基于jt808通讯协议设备管理系统

设备增删改查
设备信息接收，解析，存储
设备定位地图展示
设备历史轨迹查询，播放
前后端分离
1、后端 car_backend，使用详见内使用文档
2、前端 car_pc，使用详见内使用文档

快速开始
1、win启动car_backend\car_backend.exe，linux启动该car_backend\car_backend
2、win启动car_pc\car_pc.exe，linux启动该car_pc\car_pc
data/conf.json里配置百度地图的appkey（先配置，后启动car_pc,没有conf.json文件的，先启动生成默认conf.json，在配置启动）
3、jt808定位设备上传数据到本机10808端口
4、本机127.0.0.1:8090查看数据
